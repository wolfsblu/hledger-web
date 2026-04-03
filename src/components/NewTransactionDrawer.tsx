import { useState, useRef, useEffect } from "react";
import { X, Plus, Trash2, Check, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import { useAccounts, usePayees, useCommodities, useCreateTransaction } from "../api/hooks";

// ── Types ────────────────────────────────────────────────────────────────────

type PostingDraft = {
  id: string;
  account: string;
  amount: string;
  commodity: string;
};

type FormDraft = {
  date: string;
  date2: string;
  description: string;
  status: "unmarked" | "pending" | "cleared";
  postings: PostingDraft[];
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function makePosting(commodity = ""): PostingDraft {
  return { id: crypto.randomUUID(), account: "", amount: "", commodity };
}

function initForm(defaultCommodity: string): FormDraft {
  return {
    date: today(),
    date2: "",
    description: "",
    status: "unmarked",
    postings: [makePosting(defaultCommodity), makePosting(defaultCommodity)],
  };
}

// ── Combobox ─────────────────────────────────────────────────────────────────

interface ComboboxProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}

function Combobox({ value, onChange, options, placeholder }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIdx, setActiveIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.length > 0
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    : options.slice(0, 10);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function select(opt: string) {
    onChange(opt);
    setQuery(opt);
    setOpen(false);
    setActiveIdx(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (activeIdx >= 0 && filtered[activeIdx]) select(filtered[activeIdx]); }
    else if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); setActiveIdx(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] px-3 py-2 font-body text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-colors focus:border-[var(--color-accent-dim)] focus:outline-none"
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-1)] shadow-xl">
          {filtered.map((opt, i) => (
            <button
              key={opt}
              type="button"
              onMouseDown={e => { e.preventDefault(); select(opt); }}
              className={`block w-full px-3 py-2 text-left font-mono text-xs transition-colors ${
                i === activeIdx
                  ? "bg-[var(--color-accent-glow)] text-[var(--color-accent)]"
                  : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Status Picker ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "unmarked" as const, label: "Unmarked" },
  { value: "pending" as const, label: "Pending", icon: AlertCircle },
  { value: "cleared" as const, label: "Cleared", icon: Check },
];

function StatusPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: "unmarked" | "pending" | "cleared") => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] p-0.5">
      {STATUS_OPTIONS.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
              active
                ? "bg-[var(--color-surface-1)] text-[var(--color-text-primary)] shadow-sm"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            {opt.icon && <opt.icon size={11} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

interface NewTransactionDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function NewTransactionDrawer({ open, onClose }: NewTransactionDrawerProps) {
  const { data: accounts } = useAccounts({});
  const { data: payees } = usePayees();
  const { data: commodities } = useCommodities();
  const createTxn = useCreateTransaction();

  const accountNames = accounts?.map(a => a.fullName) ?? [];
  const payeeNames = payees ?? [];
  const defaultCommodity = commodities?.[0]?.symbol ?? "";


  const [form, setForm] = useState<FormDraft>(() => initForm(defaultCommodity));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initForm(defaultCommodity));
      setError(null);
    }
  }, [open, defaultCommodity]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  function updatePosting(id: string, patch: Partial<PostingDraft>) {
    setForm(f => ({ ...f, postings: f.postings.map(p => p.id === id ? { ...p, ...patch } : p) }));
  }

  function addPosting() {
    setForm(f => ({ ...f, postings: [...f.postings, makePosting(defaultCommodity)] }));
  }

  function removePosting(id: string) {
    setForm(f => ({ ...f, postings: f.postings.filter(p => p.id !== id) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.date) { setError("Date is required."); return; }
    if (!form.description.trim()) { setError("Description is required."); return; }

    const filledPostings = form.postings.filter(p => p.account.trim());
    if (filledPostings.length < 2) { setError("At least 2 postings with accounts are required."); return; }

    const emptyAmounts = filledPostings.filter(p => !p.amount);
    if (emptyAmounts.length > 1) { setError("Only one posting can have an auto-balanced amount."); return; }

    try {
      await createTxn.mutateAsync({
        date: form.date,
        ...(form.date2 ? { date2: form.date2 } : {}),
        description: form.description.trim(),
        status: form.status,
        postings: filledPostings.map(p => {
          const qty = parseFloat(p.amount);
          return {
            account: p.account,
            ...(!isNaN(qty)
              ? { amount: [{ commodity: p.commodity || defaultCommodity, quantity: qty }] }
              : {}),
          };
        }),
      });
      onClose();
    } catch {
      setError("Failed to create transaction. Please check your input.");
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed left-0 top-0 z-40 h-screen w-screen bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-screen w-full flex-col bg-[var(--color-surface-1)] shadow-2xl transition-transform duration-300 ease-in-out sm:w-[480px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="New Transaction"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-surface-border)] px-6 py-5">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">New Transaction</h2>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
              Add entry to ledger
            </p>
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
        <form id="new-txn-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent-dim)] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                  Bank Date <span className="normal-case tracking-normal opacity-60">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.date2}
                  onChange={e => setForm(f => ({ ...f, date2: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent-dim)] focus:outline-none"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                Status
              </label>
              <StatusPicker value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                Description
              </label>
              <Combobox
                value={form.description}
                onChange={v => setForm(f => ({ ...f, description: v }))}
                options={payeeNames}
                placeholder="Groceries, Rent, Salary…"
              />
            </div>

            {/* Postings */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                  Postings
                </span>
                <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                  Leave amount blank to auto-balance
                </span>
              </div>

              <div className="space-y-2">
                {form.postings.map((posting, idx) => (
                  <div
                    key={posting.id}
                    className="rounded-xl border border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-0)] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePosting(posting.id)}
                        disabled={form.postings.length <= 2}
                        className="rounded p-1 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-loss-dim)] hover:text-[var(--color-loss)] disabled:pointer-events-none disabled:opacity-20"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Combobox
                        value={posting.account}
                        onChange={v => updatePosting(posting.id, { account: v })}
                        options={accountNames}
                        placeholder="assets:checking"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={posting.amount}
                          onChange={e => updatePosting(posting.id, { amount: e.target.value })}
                          placeholder=""
                          step="0.01"
                          className="min-w-0 flex-1 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-colors focus:border-[var(--color-accent-dim)] focus:outline-none"
                        />
                        {commodities && commodities.length > 1 ? (
                          <div className="relative">
                            <select
                              value={posting.commodity || defaultCommodity}
                              onChange={e => updatePosting(posting.id, { commodity: e.target.value })}
                              className="appearance-none rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] py-2 pl-3 pr-7 font-mono text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent-dim)] focus:outline-none"
                            >
                              {commodities.map(c => (
                                <option key={c.symbol} value={c.symbol}>{c.symbol}</option>
                              ))}
                            </select>
                            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                          </div>
                        ) : (
                          <div className="flex items-center rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] px-3 py-2 font-mono text-sm text-[var(--color-text-tertiary)]">
                            {defaultCommodity || "—"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addPosting}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--color-surface-border)] py-2 font-mono text-xs text-[var(--color-text-tertiary)] transition-colors hover:border-[var(--color-accent-dim)] hover:text-[var(--color-accent)]"
              >
                <Plus size={12} />
                Add posting
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-[var(--color-loss-dim)] bg-[var(--color-loss-dim)] px-4 py-3 text-sm text-[var(--color-loss)]">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-[var(--color-surface-border)] px-6 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-[var(--color-surface-border)] py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTxn.isPending}
                className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-dim)] disabled:opacity-60"
              >
                {createTxn.isPending && <Loader2 size={14} className="animate-spin" />}
                Save Transaction
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
