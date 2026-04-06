import { useState, Fragment } from "react";
import { ChevronRight, Check, AlertCircle, MessageSquare } from "lucide-react";
import { formatMixedAmount } from "../lib/format";

export function MobileLedgerList({
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

export function TransactionDetail({ txn }: { txn: any }) {
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
