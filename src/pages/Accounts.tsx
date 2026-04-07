import { useState } from "react";
import { Link } from "react-router";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useAccounts } from "../api/hooks";
import { formatMixedAmount } from "../lib/format";

function countAccounts(nodes: any[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countAccounts(node.children ?? []), 0);
}

export default function Accounts() {
  const { data: accounts, isLoading } = useAccounts({});

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="shimmer h-10 w-48" />
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="shimmer h-12" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!accounts) return null;

  const total = countAccounts(accounts);

  return (
    <div className="stagger-children space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Accounts</h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          {total} accounts across {accounts.length} categories
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-1)]">
        <table className="w-full min-w-[400px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-surface-border)]">
              <th className="px-5 py-3.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                Account
              </th>
              <th className="px-5 py-3.5 text-right font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((parent: any) => (
              <AccountSection
                key={parent.fullName}
                account={parent}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountSection({ account }: { account: any }) {
  const [expanded, setExpanded] = useState(true);
  const children: any[] = account.children ?? [];

  return (
    <>
      {/* Parent row */}
      <tr
        className="group cursor-pointer border-b border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-2)]/40 transition-colors hover:bg-[var(--color-surface-2)]"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-5 py-3 font-medium">
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-text-tertiary)] transition-transform">
              {expanded ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />}
            </span>
            <Link
              to={`/accounts/${encodeURIComponent(account.fullName)}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent)]"
            >
              {account.name}
            </Link>
            {children.length > 0 && (
              <span className="rounded-md bg-[var(--color-surface-3)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-text-tertiary)]">
                {countAccounts(children)}
              </span>
            )}
          </div>
        </td>
        <td className="px-5 py-3 text-right font-mono text-sm font-semibold text-[var(--color-text-primary)]">
          {formatMixedAmount(account.balance)}
        </td>
      </tr>

      {/* Child rows */}
      {expanded && <AccountChildren nodes={children} depth={1} />}
    </>
  );
}

function AccountChildren({ nodes, depth }: { nodes: any[]; depth: number }) {
  return (
    <>
      {nodes.map((child: any) => {
        const qty = child.balance?.[0]?.quantity ?? 0;
        const nested: any[] = child.children ?? [];
        return (
          <AccountChildRow key={child.fullName} child={child} qty={qty} depth={depth} nested={nested} />
        );
      })}
    </>
  );
}

function AccountChildRow({ child, qty, depth, nested }: { child: any; qty: number; depth: number; nested: any[] }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <>
      <tr
        className="ledger-row border-b border-[var(--color-surface-border-subtle)]/50"
        onClick={nested.length > 0 ? () => setExpanded(!expanded) : undefined}
        style={nested.length > 0 ? { cursor: "pointer" } : undefined}
      >
        <td className="py-2.5 pr-4" style={{ paddingLeft: `${depth * 1.25}rem` }}>
          <Link
            to={`/accounts/${encodeURIComponent(child.fullName)}`}
            onClick={(e) => e.stopPropagation()}
            className="group/link inline-flex items-center gap-1.5 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent)]"
          >
            <span className={depth > 1 ? "border-l border-[var(--color-surface-border)] pl-3" : ""}>
              {child.name}
            </span>
            <ExternalLink size={10} className="opacity-0 transition-opacity group-hover/link:opacity-100" />
          </Link>
        </td>
        <td className={`px-5 py-2.5 text-right font-mono text-xs font-medium ${
          qty === 0
            ? "text-[var(--color-text-tertiary)]"
            : child.fullName?.startsWith("expenses")
              ? "text-[var(--color-loss)]"
              : child.fullName?.startsWith("revenue") || child.fullName?.startsWith("income")
                ? "text-[var(--color-gain)]"
                : qty >= 0
                  ? "text-[var(--color-text-secondary)]"
                  : "text-[var(--color-loss)]"
        }`}>
          {formatMixedAmount(child.balance)}
        </td>
      </tr>
      {expanded && nested.length > 0 && <AccountChildren nodes={nested} depth={depth + 1} />}
    </>
  );
}
