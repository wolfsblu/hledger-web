import { useState, useMemo, Fragment } from "react";
import { Search, ChevronLeft, ChevronRight, Check, AlertCircle, MessageSquare, ArrowUpDown, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { useTransactions } from "../api/hooks";
import { useDateRange } from "../context/DateRangeContext";
import { formatMixedAmount } from "../lib/format";
import { LedgerGrid, type ColumnDef } from "../components/LedgerGrid";
import NewTransactionDrawer from "../components/NewTransactionDrawer";

const PAGE_SIZE = 50;

export default function Transactions() {
  const { range } = useDateRange();
  const [searchFilter, setSearchFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchFilter);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchFilter]);

  const { data, isLoading } = useTransactions({
    from: range.from,
    to: range.to,
    account: debouncedSearch || undefined,
    description: debouncedSearch || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const allTxns = data?.data?.flat() ?? [];
  const transactions = useMemo(() => {
    return [...allTxns].sort((a, b) => {
      const cmp = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [allTxns, sortDir]);
  const total = data?.total ?? 0;

  const columns: ColumnDef<any>[] = [
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
        <span className="block truncate" title={txn.description}>{txn.description}</span>
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
      cellClass: "px-4 text-right font-mono text-xs font-medium",
      render: (txn) => {
        const p = txn.postings?.[0];
        const qty = p?.amount?.[0]?.quantity ?? 0;
        return p ? (
          <span className={qty >= 0 ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"}>
            {formatMixedAmount(p.amount)}
          </span>
        ) : null;
      },
    },
  ];

  return (
    <>
    <NewTransactionDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    <div className="stagger-children space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {range.label} &middot; {total > 0 ? `${total} transactions` : "No results"}
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-dim)]"
        >
          <Plus size={14} />
          New
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
        <input
          type="text"
          placeholder="Search by account or description..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] py-2 pl-9 pr-3 font-body text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-colors focus:border-[var(--color-accent-dim)] focus:outline-none"
        />
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

function MobileLedgerList({
  transactions,
  isLoading,
}: {
  transactions: any[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-px px-4 py-5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="shimmer h-[52px] rounded-md" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    );
  }
  if (transactions.length === 0) {
    return (
      <div className="px-5 py-16 text-center text-sm text-[var(--color-text-tertiary)]">
        No transactions found matching your filters.
      </div>
    );
  }
  return (
    <div>
      {transactions.map(txn => (
        <MobileLedgerRow key={txn.index} txn={txn} />
      ))}
    </div>
  );
}

function MobileLedgerRow({ txn }: { txn: any }) {
  const [expanded, setExpanded] = useState(false);
  const p = txn.postings?.[0];
  const qty = p?.amount?.[0]?.quantity ?? 0;
  const isPositive = qty >= 0;
  const barColor = isPositive ? "var(--color-gain)" : "var(--color-loss)";
  const dimColor = isPositive ? "var(--color-gain-dim)" : "var(--color-loss-dim)";

  return (
    <>
      <div
        className="group flex cursor-pointer items-stretch border-b border-[var(--color-surface-border-subtle)]/60 transition-colors active:bg-[var(--color-surface-2)]/50 last:border-b-0"
        style={expanded ? { backgroundColor: dimColor } : undefined}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Colored left bar */}
        <div
          className="w-[3px] shrink-0 transition-opacity"
          style={{
            background: `linear-gradient(to bottom, ${barColor} 0%, ${barColor} 70%, transparent 100%)`,
          }}
        />

        {/* Row content */}
        <div className="min-w-0 flex-1 px-3 py-3">
          {/* Top line: description + amount */}
          <div className="flex items-baseline gap-2">
            <span className="flex-1 truncate font-medium leading-snug text-[var(--color-text-primary)]">
              {txn.description}
            </span>
            {p && (
              <span
                className={`shrink-0 font-mono text-[13px] font-semibold tabular-nums ${
                  isPositive ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"
                }`}
              >
                {formatMixedAmount(p.amount)}
              </span>
            )}
          </div>

          {/* Bottom line: date · account + chevron */}
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-[var(--color-text-tertiary)]">{txn.date}</span>
            {p?.account && (
              <>
                <span className="text-[11px] text-[var(--color-text-tertiary)]">·</span>
                <span className="min-w-0 flex-1 truncate font-body text-[11px] text-[var(--color-text-tertiary)]">
                  {p.account}
                </span>
              </>
            )}
            <ChevronRight
              size={12}
              className={`ml-auto shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-200 ${
                expanded ? "rotate-90" : "group-hover:translate-x-0.5"
              }`}
            />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="animate-fade-in border-b border-[var(--color-surface-border)]">
          <TransactionDetail txn={txn} />
        </div>
      )}
    </>
  );
}

function TransactionDetail({ txn }: { txn: any }) {
  return (
    <div className="animate-fade-in mx-5 my-4 overflow-hidden rounded-lg border border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-0)]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto]">
        {/* Header */}
        <div className="border-b border-[var(--color-surface-border-subtle)] px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
          Account
        </div>
        <div className="border-b border-[var(--color-surface-border-subtle)] px-4 py-2 text-right font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
          Amount
        </div>
        <div className="border-b border-[var(--color-surface-border-subtle)] py-2 pl-2 pr-4 text-right font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
          Status
        </div>

        {/* Posting rows — all in the same grid so columns are shared */}
        {(txn.postings ?? []).map((p: any, i: number) => {
          const pQty = p.amount?.[0]?.quantity ?? 0;
          const isLast = i === (txn.postings?.length ?? 0) - 1;
          const rowBorder = !isLast ? "border-b border-[var(--color-surface-border-subtle)]/60" : "";
          return (
            <Fragment key={i}>
              <div className={`flex min-w-0 items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-text-primary)] ${rowBorder}`}>
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: pQty >= 0 ? "var(--color-gain)" : "var(--color-loss)" }}
                />
                <span className="break-words">{p.account.replace(/:/g, ":\u200B")}</span>
              </div>
              <div className={`flex items-center justify-end px-4 py-2.5 font-mono text-xs font-semibold tabular-nums ${pQty >= 0 ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"} ${rowBorder}`}>
                {formatMixedAmount(p.amount)}
              </div>
              <div className={`flex items-center justify-end py-2.5 pl-2 pr-4 ${rowBorder}`}>
                {p.status && p.status !== "unmarked" ? (
                  <span className="inline-flex items-center gap-1 rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">
                    {p.status === "cleared" && <Check size={9} />}
                    {p.status === "pending" && <AlertCircle size={9} />}
                    {p.status}
                  </span>
                ) : null}
              </div>
            </Fragment>
          );
        })}
      </div>

      {(txn.comment || txn.tags?.length > 0) && (
        <div className="border-t border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-2)]/30 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-3">
            {txn.comment && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
                <MessageSquare size={11} className="shrink-0" />
                {txn.comment}
              </span>
            )}
            {txn.tags?.map((tag: {name: string, value: string}, i: number) => (
              <span key={i} className="rounded bg-[var(--color-surface-3)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-text-tertiary)]">
                { tag.name }: {tag.value}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
