import { useState, useRef, useCallback, useEffect } from "react";
import {
  X, Upload, FileText, ChevronUp, Check,
  AlertCircle, Loader2, ArrowLeft, Pencil, RotateCcw, Trash2, Plus, ChevronsUpDown,
} from "lucide-react";
import { useImportCsv, useBulkCreateTransactions, useAccounts, useCommodities, useImportRules } from "../api/hooks";
import type { components } from "../api/v1";
import { useQueryClient } from "@tanstack/react-query";

type Transaction = components["schemas"]["Transaction"];
type CreateTransactionRequest = components["schemas"]["CreateTransactionRequest"];

// ── Helpers ───────────────────────────────────────────────────────────────────


function isModified(original: Transaction, current: EditableTxn): boolean {
  if (original.date !== current.date) return true;
  if ((original.date2 ?? "") !== current.date2) return true;
  if (original.description !== current.description) return true;
  if (original.postings.length !== current.postings.length) return true;
  return current.postings.some((p, i) => {
    const o = original.postings[i];
    if (!o) return true;
    if (o.account !== p.account) return true;
    const oQty = o.amount?.[0]?.quantity ?? 0;
    const pQty = p.quantity !== "" ? parseFloat(p.quantity) : 0;
    const oCom = o.amount?.[0]?.commodity ?? "";
    if (oQty !== pQty || oCom !== p.commodity) return true;
    return false;
  });
}

// ── Editable transaction state ────────────────────────────────────────────────

type EditablePosting = {
  account: string;
  quantity: string;
  commodity: string;
  status: "unmarked" | "pending" | "cleared";
};

type EditableTxn = {
  date: string;
  date2: string;
  description: string;
  status: "unmarked" | "pending" | "cleared";
  postings: EditablePosting[];
  skipped: boolean;
};

function txnToEditable(txn: Transaction): EditableTxn {
  return {
    date: txn.date,
    date2: txn.date2 ?? "",
    description: txn.description,
    status: txn.status,
    skipped: false,
    postings: txn.postings.map(p => ({
      account: p.account,
      quantity: String(p.amount?.[0]?.quantity ?? ""),
      commodity: p.amount?.[0]?.commodity ?? "",
      status: p.status,
    })),
  };
}

function editableToCreateRequest(e: EditableTxn): CreateTransactionRequest {
  return {
    date: e.date,
    ...(e.date2 ? { date2: e.date2 } : {}),
    description: e.description,
    status: e.status,
    postings: e.postings.map(p => ({
      account: p.account,
      amount: p.quantity !== "" ? [{ quantity: parseFloat(p.quantity), commodity: p.commodity }] : [],
      status: p.status,
    })),
  };
}

// ── File Drop Zone ────────────────────────────────────────────────────────────

interface DropZoneProps {
  file: File | null;
  onFile: (f: File) => void;
}

function DropZone({ file, onFile }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-all duration-200 ${
        dragging
          ? "border-[var(--color-accent)] bg-[var(--color-accent-glow)]"
          : file
          ? "border-[var(--color-gain)] bg-[var(--color-gain-dim)]"
          : "border-[var(--color-surface-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-accent-dim)] hover:bg-[var(--color-accent-glow)]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      {file ? (
        <>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-gain-dim)]">
            <FileText size={20} className="text-[var(--color-gain)]" />
          </div>
          <div className="text-center">
            <p className="font-mono text-sm font-medium text-[var(--color-text-primary)]">{file.name}</p>
            <p className="mt-0.5 font-mono text-[11px] text-[var(--color-text-tertiary)]">
              {(file.size / 1024).toFixed(1)} KB · Click to change
            </p>
          </div>
        </>
      ) : (
        <>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${dragging ? "bg-[var(--color-accent-glow)]" : "bg-[var(--color-surface-3)]"}`}>
            <Upload size={20} className={dragging ? "text-[var(--color-accent)]" : "text-[var(--color-text-tertiary)]"} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              {dragging ? "Drop to upload" : "Drop CSV here"}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-[var(--color-text-tertiary)]">or click to browse</p>
          </div>
        </>
      )}
    </div>
  );
}

// ── Transaction Preview Card ──────────────────────────────────────────────────

interface TxnCardProps {
  original: Transaction;
  editable: EditableTxn;
  onChange: (updated: EditableTxn) => void;
  onReset: () => void;
  onSkip: () => void;
  accountNames: string[];
  defaultCommodity: string;
}

function TxnCard({ original, editable, onChange, onReset, onSkip, accountNames, defaultCommodity }: TxnCardProps) {
  const [expanded, setExpanded] = useState(false);
  const dirty = isModified(original, editable);
  const firstPosting = editable.postings[0];
  const qty = parseFloat(firstPosting?.quantity ?? "0");
  const isPositive = qty >= 0;

  function updatePosting(idx: number, patch: Partial<EditablePosting>) {
    const postings = editable.postings.map((p, i) => i === idx ? { ...p, ...patch } : p);
    onChange({ ...editable, postings });
  }

  function addPosting() {
    onChange({
      ...editable,
      postings: [...editable.postings, { account: "", quantity: "", commodity: defaultCommodity, status: "unmarked" }],
    });
  }

  function removePosting(idx: number) {
    onChange({ ...editable, postings: editable.postings.filter((_, i) => i !== idx) });
  }

  return (
    <div className={`overflow-hidden rounded-xl border transition-all duration-200 ${
      editable.skipped
        ? "border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-0)] opacity-50"
        : dirty
        ? "border-[var(--color-accent-dim)] bg-[var(--color-accent-glow)]"
        : "border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-0)]"
    }`}>
      {/* Collapsed row */}
      <div className="flex items-stretch">
        {/* Main content */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isPositive ? "bg-[var(--color-gain)]" : "bg-[var(--color-loss)]"}`} />
          <div className={`min-w-0 flex-1 ${editable.skipped ? "line-through" : ""}`}>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[11px] text-[var(--color-text-tertiary)]">{editable.date}</span>
              <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">{editable.description}</span>
            </div>
            {firstPosting && (
              <div className="mt-0.5 truncate font-mono text-[11px] text-[var(--color-text-tertiary)]">
                {firstPosting.account}
              </div>
            )}
          </div>
          {firstPosting?.quantity !== "" && (
            <span className={`shrink-0 whitespace-nowrap font-mono text-xs font-semibold tabular-nums ${isPositive ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"}`}>
              {isNaN(qty) ? firstPosting.quantity : `${qty >= 0 ? "+" : ""}${qty.toFixed(2)} ${firstPosting.commodity}`}
            </span>
          )}
          {dirty && !editable.skipped && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onReset(); setExpanded(false); }}
              className="shrink-0 rounded p-1 text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-glow)]"
              title="Reset to original"
            >
              <RotateCcw size={11} />
            </button>
          )}
        </div>

        {/* Action strip */}
        <div className="flex shrink-0 flex-col border-l border-[var(--color-surface-border-subtle)]">
          <button
            type="button"
            onClick={() => { if (!editable.skipped) setExpanded(v => !v); }}
            disabled={editable.skipped}
            className={`flex flex-1 items-center justify-center px-3 border-b border-[var(--color-surface-border-subtle)] transition-colors disabled:pointer-events-none disabled:opacity-30 ${
              expanded
                ? "bg-[var(--color-surface-2)] text-[var(--color-text-primary)]"
                : "text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
            }`}
            title={expanded ? "Collapse" : "Edit"}
          >
            {expanded ? <ChevronUp size={13} /> : <Pencil size={12} />}
          </button>
          <button
            type="button"
            onClick={() => { onSkip(); setExpanded(false); }}
            className={`flex flex-1 items-center justify-center px-3 transition-colors ${
              editable.skipped
                ? "text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
                : "text-[var(--color-text-tertiary)] hover:bg-[var(--color-loss-dim)] hover:text-[var(--color-loss)]"
            }`}
            title={editable.skipped ? "Unskip" : "Skip"}
          >
            {editable.skipped ? <RotateCcw size={12} /> : <X size={12} />}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {expanded && (
        <div className="border-t border-[var(--color-surface-border-subtle)] px-3 pb-3 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Date</label>
              <input
                type="date"
                value={editable.date}
                onChange={e => onChange({ ...editable, date: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-1)] px-2.5 py-1.5 font-mono text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-dim)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                Bank Date <span className="normal-case tracking-normal opacity-60">(optional)</span>
              </label>
              <input
                type="date"
                value={editable.date2}
                onChange={e => onChange({ ...editable, date2: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-1)] px-2.5 py-1.5 font-mono text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-dim)] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Description</label>
            <input
              type="text"
              value={editable.description}
              onChange={e => onChange({ ...editable, description: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-1)] px-2.5 py-1.5 font-mono text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-dim)] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Postings</label>
            <div className="space-y-1.5">
              {editable.postings.map((p, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={p.account}
                    onChange={e => updatePosting(idx, { account: e.target.value })}
                    placeholder="account"
                    list={`accounts-${idx}`}
                    className="min-w-0 flex-[2] rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-1)] px-2.5 py-1.5 font-mono text-[11px] text-[var(--color-text-primary)] focus:border-[var(--color-accent-dim)] focus:outline-none"
                  />
                  <datalist id={`accounts-${idx}`}>
                    {accountNames.map(a => <option key={a} value={a} />)}
                  </datalist>
                  <input
                    type="number"
                    value={p.quantity}
                    onChange={e => updatePosting(idx, { quantity: e.target.value })}
                    placeholder="amount"
                    step="0.01"
                    className="w-28 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-1)] px-2.5 py-1.5 font-mono text-[11px] text-[var(--color-text-primary)] focus:border-[var(--color-accent-dim)] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={p.commodity}
                    onChange={e => updatePosting(idx, { commodity: e.target.value })}
                    placeholder="EUR"
                    className="w-14 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-1)] px-2.5 py-1.5 font-mono text-[11px] text-[var(--color-text-primary)] focus:border-[var(--color-accent-dim)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removePosting(idx)}
                    disabled={editable.postings.length <= 1}
                    className="rounded p-1.5 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-loss-dim)] hover:text-[var(--color-loss)] disabled:pointer-events-none disabled:opacity-20"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addPosting}
                className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--color-surface-border)] py-1.5 font-mono text-[11px] text-[var(--color-text-tertiary)] transition-colors hover:border-[var(--color-accent-dim)] hover:text-[var(--color-accent)]"
              >
                <Plus size={11} /> Add posting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

type Phase = "configure" | "preview" | "done";

interface ImportDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportDrawer({ open, onClose }: ImportDrawerProps) {
  const queryClient = useQueryClient();
  const { data: accounts } = useAccounts({});
  const { data: commodities } = useCommodities();
  const { data: availableRules, isLoading: rulesLoading } = useImportRules();
  const importCsv = useImportCsv();
  const bulkCreate = useBulkCreateTransactions();

  const accountNames = accounts?.map(a => a.fullName) ?? [];
  const defaultCommodity = commodities?.[0]?.symbol ?? "";

  const [phase, setPhase] = useState<Phase>("configure");
  const [rules, setRules] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preview state
  const [originalTxns, setOriginalTxns] = useState<Transaction[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [editables, setEditables] = useState<EditableTxn[]>([]);

  useEffect(() => {
    if (open) {
      setPhase("configure");
      setRules("");
      setFile(null);
      setError(null);
      setOriginalTxns([]);
      setEditables([]);
    }
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function handlePreview() {
    if (!rules.trim()) { setError("Rules file name is required."); return; }
    if (!file) { setError("Please select a CSV file."); return; }
    setError(null);
    try {
      const result = await importCsv.mutateAsync({ rules: rules.trim(), file, dryRun: true });
      setOriginalTxns(result.transactions);
      setEditables(result.transactions.map(txnToEditable));
      setSkipped(result.skipped);
      setPhase("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed.");
    }
  }

  async function handleImport() {
    setError(null);
    const toImport = editables.filter(e => !e.skipped);
    try {
      const anyModified = toImport.some((e, _i) => {
        const origIdx = editables.indexOf(e);
        return isModified(originalTxns[origIdx], e);
      });
      if (anyModified || toImport.length < originalTxns.length) {
        await bulkCreate.mutateAsync(toImport.map(editableToCreateRequest));
      } else {
        await importCsv.mutateAsync({ rules: rules.trim(), file: file!, dryRun: false });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      }
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    }
  }

  const isLoading = importCsv.isPending || bulkCreate.isPending;
  const activeEditables = editables.filter(e => !e.skipped);
  const userSkippedCount = editables.filter(e => e.skipped).length;
  const modifiedCount = activeEditables.filter((e, _) => {
    const origIdx = editables.indexOf(e);
    return isModified(originalTxns[origIdx], e);
  }).length;

  return (
    <>
      {open && (
        <div className="fixed left-0 top-0 z-40 h-screen w-screen bg-black/40 backdrop-blur-sm" onClick={onClose} />
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-screen w-full flex-col bg-[var(--color-surface-1)] shadow-2xl transition-transform duration-300 ease-in-out sm:w-[520px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Import CSV"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-surface-border)] px-6 py-5">
          <div className="flex items-center gap-3">
            {phase === "preview" && (
              <button
                type="button"
                onClick={() => setPhase("configure")}
                className="rounded-lg p-1.5 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">Import CSV</h2>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                {phase === "configure" && "Upload & preview"}
                {phase === "preview" && `${originalTxns.length} transactions · ${skipped} skipped`}
                {phase === "done" && "Import complete"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">

          {/* ── Configure phase ── */}
          {phase === "configure" && (
            <div className="flex flex-1 flex-col space-y-5 px-6 py-6">
              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                  Rules File
                </label>
                <div className="relative">
                  <select
                    value={rules}
                    onChange={e => setRules(e.target.value)}
                    disabled={rulesLoading || !availableRules?.length}
                    className="w-full appearance-none rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] px-3 py-2 pr-9 font-mono text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent-dim)] focus:outline-none disabled:opacity-50"
                  >
                    <option value="" disabled>
                      {rulesLoading ? "Loading…" : availableRules?.length === 0 ? "No rules files found" : "Select a rules file…"}
                    </option>
                    {availableRules?.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronsUpDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                  CSV File
                </label>
                <DropZone file={file} onFile={setFile} />
              </div>

              {error && (
                <div className="rounded-lg border border-[var(--color-loss-dim)] bg-[var(--color-loss-dim)] px-4 py-3 text-sm text-[var(--color-loss)]">
                  {error}
                </div>
              )}

              <div className="mt-auto pt-4">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={isLoading || !rules.trim() || !file}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-dim)] disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Preview Import
                </button>
              </div>
            </div>
          )}

          {/* ── Preview phase ── */}
          {phase === "preview" && (
            <div className="flex flex-1 flex-col">
              {/* Summary bar */}
              <div className="flex shrink-0 items-center gap-4 border-b border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-2)] px-6 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-gain-dim)]">
                    <Check size={10} className="text-[var(--color-gain)]" />
                  </span>
                  <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                    <span className="font-semibold text-[var(--color-text-primary)]">{activeEditables.length}</span> to import
                  </span>
                </div>
                {(skipped + userSkippedCount) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-surface-3)]">
                      <AlertCircle size={10} className="text-[var(--color-text-tertiary)]" />
                    </span>
                    <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                      <span className="font-semibold text-[var(--color-text-primary)]">{skipped + userSkippedCount}</span> skipped
                    </span>
                  </div>
                )}
                {modifiedCount > 0 && (
                  <div className="ml-auto flex items-center gap-1 font-mono text-[11px] text-[var(--color-accent)]">
                    <Pencil size={10} />
                    {modifiedCount} edited
                  </div>
                )}
              </div>

              {/* Transaction list */}
              <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
                {editables.length === 0 ? (
                  <div className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                    No new transactions to import — all were already skipped.
                  </div>
                ) : (
                  editables.map((editable, i) => (
                    <TxnCard
                      key={i}
                      original={originalTxns[i]}
                      editable={editable}
                      onChange={updated => setEditables(prev => prev.map((e, j) => j === i ? updated : e))}
                      onReset={() => setEditables(prev => prev.map((e, j) => j === i ? txnToEditable(originalTxns[i]) : e))}
                      onSkip={() => setEditables(prev => prev.map((e, j) => j === i ? { ...e, skipped: !e.skipped } : e))}
                      accountNames={accountNames}
                      defaultCommodity={defaultCommodity}
                    />
                  ))
                )}
              </div>

              {error && (
                <div className="mx-6 mb-2 rounded-lg border border-[var(--color-loss-dim)] bg-[var(--color-loss-dim)] px-4 py-3 text-sm text-[var(--color-loss)]">
                  {error}
                </div>
              )}

              {/* Footer */}
              <div className="shrink-0 border-t border-[var(--color-surface-border)] px-6 py-4">
                {modifiedCount > 0 && (
                  <p className="mb-3 text-center font-mono text-[11px] text-[var(--color-text-tertiary)]">
                    {modifiedCount} transaction{modifiedCount !== 1 ? "s" : ""} edited — will use bulk create
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPhase("configure")}
                    className="flex-1 rounded-lg border border-[var(--color-surface-border)] py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={isLoading || activeEditables.length === 0}
                    className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-dim)] disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Import {activeEditables.length} Transaction{activeEditables.length !== 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Done phase ── */}
          {phase === "done" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-gain-dim)]">
                <Check size={28} className="text-[var(--color-gain)]" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold tracking-tight">Import complete</h3>
                <p className="mt-1.5 text-sm text-[var(--color-text-tertiary)]">
                  {activeEditables.length} transaction{activeEditables.length !== 1 ? "s" : ""} added to your ledger.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-[var(--color-accent)] px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-dim)]"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
