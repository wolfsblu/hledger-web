import { useState } from "react";
import { useParams, Link } from "react-router";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ArrowLeft, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { useAccountDetail, useAccountRegister, useAccountBalance } from "../api/hooks";
import { useDateRange } from "../context/DateRangeContext";
import { formatMixedAmount } from "../lib/format";

const PAGE_SIZE = 50;

export default function AccountDetail() {
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name ?? "");
  const { range } = useDateRange();
  const [offset, setOffset] = useState(0);

  const detail = useAccountDetail(decodedName);
  const register = useAccountRegister(decodedName, {
    from: range.from,
    to: range.to,
    limit: PAGE_SIZE,
    offset,
  });
  const balance = useAccountBalance(decodedName, { from: range.from, to: range.to });

  const total = register.data?.total ?? 0;
  const entries = register.data?.entries ?? [];

  const history = balance.data?.history ?? [];
  const balanceChartData = history.map((h: any) => ({
    date: h.date,
    balance: h.balance?.[0]?.quantity ?? 0,
  }));

  return (
    <div className="stagger-children space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/accounts"
          className="group mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent)]"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Accounts
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{decodedName}</h1>
        {detail.data && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {detail.data.type && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-2)] px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                <Tag size={10} />
                {detail.data.type}
              </span>
            )}
            <span className="text-sm text-[var(--color-text-tertiary)]">
              <span className="font-mono font-semibold text-[var(--color-text-primary)]">
                {formatMixedAmount(detail.data.balance ?? [])}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Balance Chart */}
      {balanceChartData.length > 1 && (
        <div className="card-glow rounded-xl border border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-1)] p-6">
          <h3 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
            Balance Over Time
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={balanceChartData}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border-subtle)" vertical={false} />
              <XAxis
                dataKey="date"
                fontSize={11}
                fontFamily="var(--font-mono)"
                tick={{ fill: "var(--color-text-tertiary)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                fontSize={11}
                fontFamily="var(--font-mono)"
                tick={{ fill: "var(--color-text-tertiary)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [`$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, "Balance"]}
                contentStyle={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-surface-border)",
                  borderRadius: "8px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="var(--color-chart-3)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "var(--color-chart-3)", stroke: "var(--color-surface-1)", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Register */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-1)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-surface-border)]">
              {["Date", "Description", "Other Account(s)", "Amount", "Balance"].map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)] ${i >= 3 ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {register.isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="mx-auto space-y-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="shimmer mx-auto h-8" style={{ animationDelay: `${i * 80}ms` }} />
                    ))}
                  </div>
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                  No entries found for this period.
                </td>
              </tr>
            ) : (
              entries.map((entry: any, i: number) => {
                const qty = entry.amount?.[0]?.quantity ?? 0;
                return (
                  <tr key={i} className="ledger-row border-b border-[var(--color-surface-border-subtle)]/50">
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-[var(--color-text-tertiary)]">{entry.date}</td>
                    <td className="max-w-[220px] px-5 py-3 font-medium text-[var(--color-text-primary)]">
                      <span className="block truncate" title={entry.description}>{entry.description}</span>
                    </td>
                    <td className="max-w-[180px] px-5 py-3 text-[var(--color-text-tertiary)]">
                      <span className="block truncate">{(entry.otherAccounts ?? []).join(", ")}</span>
                    </td>
                    <td className={`whitespace-nowrap px-5 py-3 text-right font-mono text-xs font-medium ${qty >= 0 ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"}`}>
                      {formatMixedAmount(entry.amount ?? [])}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-mono text-xs text-[var(--color-text-secondary)]">
                      {formatMixedAmount(entry.balance ?? [])}
                    </td>
                  </tr>
                );
              })
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
