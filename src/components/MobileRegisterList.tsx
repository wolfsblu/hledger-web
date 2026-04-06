import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { formatMixedAmount } from "../lib/format";

export function MobileRegisterList({
  entries,
  isLoading,
}: {
  entries: any[];
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
  if (entries.length === 0) {
    return (
      <div className="px-5 py-16 text-center text-sm text-[var(--color-text-tertiary)]">
        No entries found for this period.
      </div>
    );
  }
  return (
    <div>
      {entries.map((entry: any, i: number) => (
        <MobileRegisterRow key={i} entry={entry} />
      ))}
    </div>
  );
}

function MobileRegisterRow({ entry }: { entry: any }) {
  const [expanded, setExpanded] = useState(false);
  const qty = entry.amount?.[0]?.quantity ?? 0;
  const isPositive = qty >= 0;
  const barColor = isPositive ? "var(--color-gain)" : "var(--color-loss)";
  const dimColor = isPositive ? "var(--color-gain-dim)" : "var(--color-loss-dim)";
  const otherAccounts: string[] = entry.otherAccounts ?? [];

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
              {entry.description}
            </span>
            <span
              className={`shrink-0 font-mono text-[13px] font-semibold tabular-nums ${
                isPositive ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"
              }`}
            >
              {formatMixedAmount(entry.amount ?? [])}
            </span>
          </div>

          {/* Bottom line: date · other accounts + chevron */}
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-[var(--color-text-tertiary)]">{entry.date}</span>
            {otherAccounts.length > 0 && (
              <>
                <span className="text-[11px] text-[var(--color-text-tertiary)]">·</span>
                <span className="min-w-0 flex-1 truncate font-body text-[11px] text-[var(--color-text-tertiary)]">
                  {otherAccounts.join(", ")}
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
          <RegisterDetail entry={entry} />
        </div>
      )}
    </>
  );
}

function RegisterDetail({ entry }: { entry: any }) {
  const otherAccounts: string[] = entry.otherAccounts ?? [];
  const balQty = entry.balance?.[0]?.quantity ?? 0;
  const isBalPositive = balQty >= 0;

  return (
    <div className="animate-fade-in mx-5 my-4 overflow-hidden rounded-lg border border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-0)]">
      {/* Other accounts list */}
      {otherAccounts.length === 0 ? (
        <div className="px-4 py-2.5 text-sm text-[var(--color-text-tertiary)]">—</div>
      ) : (
        otherAccounts.map((acct, i) => (
          <div key={i} className="flex min-w-0 items-center gap-2 border-b border-[var(--color-surface-border-subtle)]/60 px-4 py-2.5 text-sm text-[var(--color-text-primary)]">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: "var(--color-text-tertiary)" }}
            />
            <span className="break-words">{acct.replace(/:/g, ":\u200B")}</span>
          </div>
        ))
      )}

      {/* Balance footer */}
      <div className="flex items-center justify-between border-t border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-2)]/30 px-4 py-2.5">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Balance</span>
        <span className={`font-mono text-xs font-semibold tabular-nums ${isBalPositive ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"}`}>
          {formatMixedAmount(entry.balance ?? [])}
        </span>
      </div>
    </div>
  );
}
