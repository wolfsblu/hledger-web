import { useState, useMemo, useCallback } from "react";
import type { components } from "../api/v1";
import { ChevronLeft, ChevronRight, Check, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Plus, Upload, MessageSquare } from "lucide-react";
import { useTransactions } from "../api/hooks";
import { useDateRange } from "../context/DateRangeContext";
import { formatMixedAmount } from "../lib/format";
import { LedgerGrid, type ColumnDef } from "../components/LedgerGrid";
import { MobileLedgerList, TransactionDetail } from "../components/MobileLedgerList";
import NewTransactionDrawer from "../components/NewTransactionDrawer";
import ImportDrawer from "../components/ImportDrawer";
import TransactionFilterPanel from "../components/TransactionFilterPanel";
import { useTransactionFilters } from "../hooks/useTransactionFilters";

const PAGE_SIZE = 50;

export default function Transactions() {
  const { range } = useDateRange();
  const [offset, setOffset] = useState(0);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const filters = useTransactionFilters(
    useCallback(() => setOffset(0), []),
  );

  const { data, isLoading } = useTransactions({
    from: range.from,
    to: range.to,
    account: filters.accountParam,
    description: filters.debouncedDescription || undefined,
    status: filters.statusParam,
    tag: filters.tagParam,
    minAmount: filters.debouncedMinAmount,
    maxAmount: filters.debouncedMaxAmount,
    limit: PAGE_SIZE,
    offset,
  });

  const transactions = useMemo(() => {
    const allTxns = data?.data?.flat() ?? [];
    return [...allTxns].sort((a, b) => {
      const cmp = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortDir]);
  const total = data?.total ?? 0;

  type Transaction = components["schemas"]["Transaction"];
  const columns: ColumnDef<Transaction>[] = [
    {
      id: "status",
      header: "Status",
      width: "2.5rem",
      cellClass: "px-2",
      render: (txn) => {
        const s = statusConfig[txn.status];
        return s
          ? <s.icon size={13} style={{ color: s.color }} />
          : <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-surface-3)]" />;
      },
    },
    {
      id: "date",
      header: (
        <button
          className="inline-flex items-center gap-1 uppercase tracking-[0.12em] transition-colors hover:text-[var(--color-text-primary)]"
          onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
        >
          Date
          {sortDir === "desc" ? <ArrowDown size={10} /> : sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowUpDown size={10} />}
        </button>
      ),
      width: "7rem",
      headerClass: "pl-6 pr-4",
      cellClass: "pl-6 pr-4 font-mono text-xs text-[var(--color-text-tertiary)]",
      render: (txn) => txn.date,
    },
    {
      id: "description",
      header: "Description",
      width: "1fr",
      headerClass: "px-4",
      cellClass: "min-w-0 px-4 font-medium text-[var(--color-text-primary)]",
      render: (txn) => (
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate" title={txn.description}>{txn.description}</span>
          {txn.comment && (
            <span title={txn.comment}><MessageSquare size={12} className="shrink-0 text-[var(--color-text-tertiary)]" /></span>
          )}
        </div>
      ),
    },
    {
      id: "account",
      header: "Account",
      width: "max-content",
      headerClass: "px-4",
      cellClass: "whitespace-nowrap px-4 text-[var(--color-text-tertiary)]",
      render: (txn) => txn.postings?.[0]?.account,
    },
    {
      id: "amount",
      header: "Amount",
      width: "max-content",
      headerClass: "px-4 text-right",
      cellClass: "px-4 justify-end font-mono text-xs font-medium",
      render: (txn) => {
        const p = txn.postings?.[0];
        const qty = p?.amount?.[0]?.quantity ?? 0;
        return p ? (
          <span className={`amount ${qty >= 0 ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"}`}>
            {formatMixedAmount(p.amount)}
          </span>
        ) : null;
      },
    },
  ];

  return (
    <>
    <NewTransactionDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    <ImportDrawer open={importOpen} onClose={() => setImportOpen(false)} />
    <div className="stagger-children space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {range.label} &middot; {total > 0 ? `${total} transactions` : "No results"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-surface-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] sm:px-4"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-dim)] sm:px-4"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="relative z-10">
        <TransactionFilterPanel filters={filters} />
      </div>

      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-1)] md:block">
        <LedgerGrid
          columns={columns}
          rows={transactions}
          rowKey={(txn) => txn.index}
          renderExpanded={(txn) => <TransactionDetail txn={txn} />}
          isLoading={isLoading}
          emptyMessage="No transactions found matching your filters."
        />
      </div>

      {/* Mobile */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-1)] md:hidden">
        <MobileLedgerList transactions={transactions} isLoading={isLoading} />
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between rounded-xl border border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-1)] px-5 py-3">
          <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-surface-border)] px-3 py-1.5 font-mono text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-30"
            >
              <ChevronLeft size={12} /> Prev
            </button>
            <button
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-surface-border)] px-3 py-1.5 font-mono text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-30"
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

const statusConfig: Record<string, { icon: typeof Check; color: string }> = {
  cleared: { icon: Check, color: "var(--color-gain)" },
  pending: { icon: AlertCircle, color: "var(--color-accent)" },
};
