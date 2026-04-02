import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronRight, ChevronLeft, Check, AlertCircle, MessageSquare } from "lucide-react";
import { useTransactions } from "../api/hooks";
import { useDateRange } from "../context/DateRangeContext";
import { formatMixedAmount } from "../lib/format";

const PAGE_SIZE = 50;

export default function Transactions() {
  const { range } = useDateRange();
  const [accountFilter, setAccountFilter] = useState("");
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const [debouncedAccount, setDebouncedAccount] = useState("");
  const [debouncedDescription, setDebouncedDescription] = useState("");

  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedAccount(accountFilter);
      setDebouncedDescription(descriptionFilter);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [accountFilter, descriptionFilter]);

  const { data, isLoading } = useTransactions({
    from: range.from,
    to: range.to,
    account: debouncedAccount || undefined,
    description: debouncedDescription || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const transactions = data?.data?.flat() ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="stagger-children space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Transactions</h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          {range.label} &middot; {total > 0 ? `${total} transactions` : "No results"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="Filter by account..."
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] py-2 pl-9 pr-3 font-body text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-colors focus:border-[var(--color-accent-dim)] focus:outline-none"
          />
        </div>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="Filter by description..."
            value={descriptionFilter}
            onChange={(e) => setDescriptionFilter(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] py-2 pl-9 pr-3 font-body text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-colors focus:border-[var(--color-accent-dim)] focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-1)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-surface-border)]">
              <th className="w-10 px-3 py-3.5" />
              {["Status", "Date", "Description", "Postings", "Amount"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)] ${i === 4 ? "text-right" : "text-left"} ${i === 0 ? "w-12" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12">
                  <div className="space-y-2">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div key={i} className="shimmer h-10" style={{ animationDelay: `${i * 60}ms` }} />
                    ))}
                  </div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-sm text-[var(--color-text-tertiary)]">
                  No transactions found matching your filters.
                </td>
              </tr>
            ) : (
              transactions.map((txn: any) => (
                <TransactionRow
                  key={txn.index}
                  txn={txn}
                  expanded={expandedIndex === txn.index}
                  onToggle={() => setExpandedIndex(expandedIndex === txn.index ? null : txn.index)}
                />
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-[var(--color-surface-border)] px-5 py-3">
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
    </div>
  );
}

const statusConfig: Record<string, { icon: typeof Check; color: string; label: string }> = {
  cleared: { icon: Check, color: "var(--color-gain)", label: "Cleared" },
  pending: { icon: AlertCircle, color: "var(--color-accent)", label: "Pending" },
};

function TransactionRow({
  txn,
  expanded,
  onToggle,
}: {
  txn: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  const firstPosting = txn.postings?.[0];
  const qty = firstPosting?.amount?.[0]?.quantity ?? 0;
  const status = statusConfig[txn.status];

  return (
    <>
      <tr
        className="ledger-row cursor-pointer border-b border-[var(--color-surface-border-subtle)]/50"
        onClick={onToggle}
      >
        <td className="px-3 py-3 text-center text-[var(--color-text-tertiary)]">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </td>
        <td className="px-4 py-3">
          {status ? (
            <status.icon size={13} style={{ color: status.color }} />
          ) : (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-surface-3)]" />
          )}
        </td>
        <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-tertiary)]">{txn.date}</td>
        <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{txn.description}</td>
        <td className="px-4 py-3 text-[var(--color-text-tertiary)]">
          {(txn.postings ?? []).map((p: any) => p.account).join(" → ")}
        </td>
        <td className={`px-4 py-3 text-right font-mono text-xs font-medium ${qty >= 0 ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"}`}>
          {firstPosting ? formatMixedAmount(firstPosting.amount) : ""}
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr className="border-b border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-2)]/30">
          <td colSpan={6} className="px-12 py-4">
            <div className="animate-fade-in space-y-3">
              {/* Postings table */}
              <table className="w-full">
                <tbody>
                  {(txn.postings ?? []).map((p: any, i: number) => {
                    const pQty = p.amount?.[0]?.quantity ?? 0;
                    return (
                      <tr key={i}>
                        <td className="py-1 text-sm text-[var(--color-text-secondary)]">{p.account}</td>
                        <td className={`py-1 text-right font-mono text-xs font-medium ${pQty >= 0 ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"}`}>
                          {formatMixedAmount(p.amount)}
                        </td>
                        <td className="py-1 pl-3 text-right">
                          {p.status && p.status !== "unmarked" && (
                            <span className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">
                              {p.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Comment */}
              {txn.comment && (
                <div className="flex items-start gap-2 text-sm text-[var(--color-text-tertiary)]">
                  <MessageSquare size={12} className="mt-0.5 shrink-0" />
                  {txn.comment}
                </div>
              )}

              {/* Tags */}
              {txn.tags?.length > 0 && (
                <div className="flex gap-1.5">
                  {txn.tags.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="rounded-md bg-[var(--color-surface-3)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-text-tertiary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
