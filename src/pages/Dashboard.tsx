import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useDateRange } from "../context/DateRangeContext";
import { useBalanceSheet, useIncomeStatement, useTransactions, useAccountRegister } from "../api/hooks";
import { formatMixedAmount, formatAmount, mergeNetWorthByCommodity } from "../lib/format";
import StatCard from "../components/StatCard";
import { LedgerGrid, type ColumnDef } from "../components/LedgerGrid";
import { Link } from "react-router";

export default function Dashboard() {
  const { range } = useDateRange();
  const balanceSheet = useBalanceSheet({});
  const incomeStatement = useIncomeStatement({ from: range.from, to: range.to, depth: 2 });
  const recentTxns = useTransactions({ limit: 10 });
  const assetsRegister = useAccountRegister("assets", { from: range.from, to: range.to, limit: 10000 });
  const liabilitiesRegister = useAccountRegister("liabilities", { from: range.from, to: range.to, limit: 10000 });

  const toBalanceItems = (entries: NonNullable<ReturnType<typeof useAccountRegister>["data"]>["entries"]) => {
    // Keep only the last entry per date (end-of-day balance)
    const byDate = new Map<string, typeof entries[number]>();
    for (const e of entries ?? []) {
      if (e.date && e.balance) byDate.set(e.date, e);
    }
    return Array.from(byDate.values()).map((e) => ({ date: e.date!, balance: e.balance! }));
  };

  const { series: netWorthSeries, commodities: netWorthCommodities } = mergeNetWorthByCommodity(
    toBalanceItems(assetsRegister.data?.entries),
    toBalanceItems(liabilitiesRegister.data?.entries)
  );
  const isNetWorthLoading = assetsRegister.isLoading || liabilitiesRegister.isLoading;

  return (
    <div className="stagger-children space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          {range.label.includes("—") ? range.label : `${range.label} \u00b7 ${range.from} \u2014 ${range.to}`}
        </p>
      </div>

      {/* Top stat cards row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Net Worth */}
        <StatCard title="Net Worth" className="lg:col-span-1">
          {balanceSheet.isLoading ? (
            <Shimmer className="h-12 w-48" />
          ) : balanceSheet.data ? (() => {
            const nw = balanceSheet.data.netWorth ?? [];
            const isZero = nw.length === 0 || nw.every((a: any) => a.quantity === 0);
            const isNegative = !isZero && nw.some((a: any) => a.quantity < 0);
            return (
              <div>
                <div className={`font-mono text-4xl font-semibold tracking-tight ${isZero ? "text-[var(--color-text-tertiary)]" : isNegative ? "text-[var(--color-loss)]" : "text-[var(--color-text-primary)]"}`}>
                  {formatMixedAmount(nw)}
                </div>
              </div>
            );
          })() : null}
        </StatCard>

        {/* Assets */}
        <StatCard title="Total Assets">
          {balanceSheet.isLoading ? (
            <Shimmer className="h-12 w-40" />
          ) : balanceSheet.data ? (
            <div className="flex items-end gap-2">
              <span className="font-mono text-3xl font-semibold tracking-tight text-[var(--color-gain)]">
                {formatMixedAmount(balanceSheet.data.assets?.total ?? [])}
              </span>
              <TrendingUp size={20} className="mb-1 text-[var(--color-gain)]" />
            </div>
          ) : null}
        </StatCard>

        {/* Liabilities */}
        <StatCard title="Total Liabilities">
          {balanceSheet.isLoading ? (
            <Shimmer className="h-12 w-40" />
          ) : balanceSheet.data ? (() => {
            const total = balanceSheet.data.liabilities?.total ?? [];
            const isZero = total.length === 0 || total.every((a: any) => a.quantity === 0);
            return (
              <div className="flex items-end gap-2">
                <span className={`font-mono text-3xl font-semibold tracking-tight ${isZero ? "text-[var(--color-text-tertiary)]" : "text-[var(--color-loss)]"}`}>
                  {formatMixedAmount(total)}
                </span>
                {!isZero && <TrendingDown size={20} className="mb-1 text-[var(--color-loss)]" />}
              </div>
            );
          })() : null}
        </StatCard>
      </div>

      {/* Net Worth Over Time */}
      <NetWorthChart series={netWorthSeries} commodities={netWorthCommodities} isLoading={isNetWorthLoading} from={range.from} to={range.to} />

      {/* Income vs Expenses — full width */}
      <StatCard title="Income vs Expenses">
        {incomeStatement.isLoading ? (
          <Shimmer className="h-52" />
        ) : incomeStatement.data ? (
          <IncomeVsExpenses data={incomeStatement.data} />
        ) : null}
      </StatCard>

      {/* Dynamic pair: income sources + spending by category */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Income Sources */}
        <StatCard title="Top Income Sources">
          {incomeStatement.isLoading ? (
            <Shimmer className="h-52" />
          ) : incomeStatement.data ? (
            <IncomeBySource rows={incomeStatement.data.revenues?.rows ?? incomeStatement.data.income?.rows ?? []} />
          ) : null}
        </StatCard>

        {/* Spending by Category */}
        <StatCard title="Spending by Category">
          {incomeStatement.isLoading ? (
            <Shimmer className="h-52" />
          ) : incomeStatement.data ? (
            <SpendingByCategory rows={incomeStatement.data.expenses?.rows ?? []} />
          ) : null}
        </StatCard>
      </div>

      {/* Recent Transactions */}
      <StatCard
        title="Recent Transactions"
        flush
        headerAction={
          <Link
            to="/transactions"
            className="group flex items-center gap-1 text-xs font-medium text-[var(--color-accent-dim)] transition-colors hover:text-[var(--color-accent)]"
          >
            View all
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        }
      >
        <RecentTransactions
          data={recentTxns.data?.data?.flat() ?? []}
          isLoading={recentTxns.isLoading}
        />
      </StatCard>
    </div>
  );
}

function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`shimmer ${className}`} />;
}

function IncomeVsExpenses({ data }: { data: any }) {
  const incomeTotals: any[] = data.revenues?.total ?? data.income?.total ?? [];
  const expenseTotals: any[] = data.expenses?.total ?? [];
  const commodity = incomeTotals[0]?.commodity ?? expenseTotals[0]?.commodity ?? "$";
  const income = Math.abs(incomeTotals[0]?.quantity ?? 0);
  const expenses = Math.abs(expenseTotals[0]?.quantity ?? 0);
  const net = income - expenses;
  const fmt = (v: number) => formatAmount({ commodity, quantity: v });

  const isDeficit = expenses > income;
  const hasData = income > 0 || expenses > 0;
  const savingsPct = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
  const overPct = income > 0 ? Math.round(((expenses - income) / income) * 100) : 0;
  const spentPct = income > 0 ? Math.min(Math.round((expenses / income) * 100), 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero metric */}
      <div className="flex items-baseline gap-2">
        {!hasData ? (
          <span className="font-mono text-4xl font-semibold leading-none tracking-tight text-[var(--color-text-tertiary)]">—</span>
        ) : isDeficit ? (
          <>
            <span className="font-mono text-4xl font-semibold leading-none tracking-tight text-[var(--color-loss)]">
              +{overPct}%
            </span>
            <span className="text-sm text-[var(--color-text-tertiary)]">over income</span>
          </>
        ) : (
          <>
            <span className="font-mono text-4xl font-semibold leading-none tracking-tight text-[var(--color-gain)]">
              {savingsPct}%
            </span>
            <span className="text-sm text-[var(--color-text-tertiary)]">savings rate</span>
          </>
        )}
      </div>

      {/* Segmented progress bar: red = spent, green = saved */}
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
        {hasData && (
          isDeficit ? (
            <div className="h-full w-full rounded-full bg-[var(--color-loss)]" />
          ) : (
            <div className="flex h-full gap-px">
              <div
                className="h-full rounded-l-full transition-all duration-700"
                style={{ width: `${spentPct}%`, backgroundColor: "var(--color-loss)" }}
              />
              <div
                className="h-full flex-1 rounded-r-full transition-all duration-700"
                style={{ backgroundColor: "var(--color-gain)" }}
              />
            </div>
          )
        )}
      </div>

      {/* Three-column stats */}
      <div className="grid grid-cols-3">
        <div>
          <div className="text-xs text-[var(--color-text-tertiary)]">Income</div>
          <div className="mt-1 font-mono text-sm font-semibold text-[var(--color-gain)]">
            {income > 0 ? fmt(income) : "—"}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-[var(--color-text-tertiary)]">Net</div>
          <div className={`mt-1 font-mono text-sm font-semibold ${net >= 0 ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"}`}>
            {hasData ? `${net >= 0 ? "+" : ""}${fmt(net)}` : "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[var(--color-text-tertiary)]">Expenses</div>
          <div className="mt-1 font-mono text-sm font-semibold text-[var(--color-loss)]">
            {expenses > 0 ? fmt(expenses) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function SpendingByCategory({ rows }: { rows: any[] }) {
  const expenses = rows
    .filter((r: any) => r.account && r.account !== "expenses")
    .map((r: any) => ({
      name: r.account?.split(":").pop() ?? r.account,
      amount: Math.abs(r.amount?.[0]?.quantity ?? 0),
      commodity: r.amount?.[0]?.commodity ?? "$",
    }))
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const colors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
    "var(--color-accent-dim)",
    "var(--color-gain)",
    "var(--color-loss)",
  ];

  if (expenses.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">No expense data found.</p>;
  }

  const max = expenses[0]?.amount ?? 1;

  return (
    <div className="space-y-3">
      {expenses.map((exp, i) => (
        <div key={exp.name} className="group">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)] transition-colors group-hover:text-[var(--color-text-primary)]">
              {exp.name}
            </span>
            <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
              {formatAmount({ commodity: exp.commodity, quantity: exp.amount })}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(exp.amount / max) * 100}%`,
                backgroundColor: colors[i % colors.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function IncomeBySource({ rows }: { rows: any[] }) {
  const colors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
    "var(--color-accent-dim)",
    "var(--color-gain)",
    "var(--color-loss)",
  ];

  const sources = rows
    .filter((r: any) => r.account && !["revenues", "revenue", "income"].includes(r.account))
    .map((r: any) => ({
      name: r.account?.split(":").pop() ?? r.account,
      amount: Math.abs(r.amount?.[0]?.quantity ?? 0),
      commodity: r.amount?.[0]?.commodity ?? "$",
    }))
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  if (sources.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">No income data found.</p>;
  }

  const max = sources[0]?.amount ?? 1;

  return (
    <div className="space-y-3">
      {sources.map((src, i) => (
        <div key={src.name} className="group">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)] transition-colors group-hover:text-[var(--color-text-primary)]">
              {src.name}
            </span>
            <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
              {formatAmount({ commodity: src.commodity, quantity: src.amount })}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(src.amount / max) * 100}%`,
                backgroundColor: colors[i % colors.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const recentTxnColumns: ColumnDef<any>[] = [
  {
    id: "date",
    header: "Date",
    width: "7rem",
    headerClass: "px-4",
    cellClass: "px-4 font-mono text-xs text-[var(--color-text-tertiary)]",
    render: (txn) => txn.date,
  },
  {
    id: "description",
    header: "Description",
    width: "1fr",
    headerClass: "px-4",
    cellClass: "overflow-hidden px-4 font-medium text-[var(--color-text-primary)]",
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

function RecentTransactions({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  return (
    <LedgerGrid
      columns={recentTxnColumns}
      rows={data}
      rowKey={(txn) => txn.index}
      isLoading={isLoading}
      emptyMessage="No transactions found."
    />
  );
}

// Each entry: [positive color, negative color]
// Positive = above zero (cool tones — never red/orange)
// Negative = below zero (warm tones — never green/teal)
// No two commodities share any color
const COMMODITY_PALETTE: [string, string][] = [
  ["var(--color-gain)", "var(--color-loss)"], // green     / red  (default)
  ["#60a5fa", "#fb923c"],                     // blue      / orange
  ["#a78bfa", "#f472b6"],                     // violet    / pink
  ["#22d3ee", "#fbbf24"],                     // cyan      / amber
  ["#818cf8", "#e879f9"],                     // indigo    / fuchsia
];

function NetWorthChart({
  series,
  commodities,
  isLoading,
  from,
  to,
}: {
  series: { date: string; [c: string]: number }[];
  commodities: string[];
  isLoading: boolean;
  from: string;
  to: string;
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (c: string) =>
    setHidden((prev) => {
      const s = new Set(prev);
      s.has(c) ? s.delete(c) : s.add(c);
      return s;
    });
  const visible = commodities.filter((c) => !hidden.has(c));

  const paddedSeries =
    series.length === 1
      ? [
          { date: from, ...Object.fromEntries(commodities.map((c) => [c, series[0][c] ?? 0])) },
          series[0],
          { date: to, ...Object.fromEntries(commodities.map((c) => [c, series[0][c] ?? 0])) },
        ]
      : series;

  const baselines: Record<string, number> = {};
  for (const c of commodities) baselines[c] = paddedSeries[0]?.[c] ?? 0;

  const chartData = paddedSeries.map((p) => {
    const entry: Record<string, number | string> = { date: p.date };
    for (const c of commodities) {
      entry[c] = p[c] - baselines[c];
      entry[c + "_abs"] = p[c];
    }
    return entry;
  });

  const spanDays =
    paddedSeries.length >= 2
      ? (new Date(paddedSeries[paddedSeries.length - 1].date).getTime() -
          new Date(paddedSeries[0].date).getTime()) /
        (1000 * 60 * 60 * 24)
      : 0;
  const xTickFormat = spanDays > 180 ? "MMM yy" : "MMM d";

  const formatXTick = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      month: "short",
      ...(xTickFormat === "MMM d" ? { day: "numeric" } : { year: "2-digit" }),
    });
  };

  const formatYTick = (v: number) => {
    if (v === 0) return "0";
    const abs = Math.abs(v);
    const sign = v > 0 ? "+" : "-";
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}k`;
    return `${sign}${abs.toFixed(0)}`;
  };

  return (
    <StatCard
      title="Net Worth Over Time"
      stretch
      headerAction={
        !isLoading && commodities.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {commodities.map((c, i) => {
              const base = baselines[c];
              const last = paddedSeries[paddedSeries.length - 1]?.[c] ?? base;
              const absDelta = last - base;
              const isUp = absDelta >= 0;
              const [posColor] = COMMODITY_PALETTE[i % COMMODITY_PALETTE.length];
              return (
                <button
                  key={c}
                  onClick={() => toggle(c)}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-xs font-medium transition-opacity ${hidden.has(c) ? "opacity-30" : "opacity-100"}`}
                  style={{ color: posColor, borderColor: posColor }}
                >
                  {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {isUp ? "+" : ""}{formatAmount({ commodity: c, quantity: absDelta })}
                </button>
              );
            })}
          </div>
        ) : null
      }
    >
      {isLoading ? (
        <Shimmer className="h-52" />
      ) : paddedSeries.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">
          No data for this period.
        </p>
      ) : (
        <div style={{ minHeight: 200 }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                {commodities.map((c, i) => {
                  const vals = chartData.map((p) => p[c] as number);
                  const maxD = Math.max(...vals, 0);
                  const minD = Math.min(...vals, 0);
                  const span = maxD - minD;
                  const z = span > 0 ? `${((maxD / span) * 100).toFixed(2)}%` : "0%";
                  const [pos, neg] = COMMODITY_PALETTE[i % COMMODITY_PALETTE.length];
                  return (
                    <g key={c}>
                      <linearGradient id={`nwFill${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={pos} stopOpacity={0.25} />
                        <stop offset={z}    stopColor={pos} stopOpacity={0.02} />
                        <stop offset={z}    stopColor={neg} stopOpacity={0.02} />
                        <stop offset="100%" stopColor={neg} stopOpacity={0.25} />
                      </linearGradient>
                      <linearGradient id={`nwStroke${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor={pos} stopOpacity={1} />
                        <stop offset={z}   stopColor={pos} stopOpacity={1} />
                        <stop offset={z}   stopColor={neg} stopOpacity={1} />
                        <stop offset="100%" stopColor={neg} stopOpacity={1} />
                      </linearGradient>
                    </g>
                  );
                })}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-surface-border-subtle)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatXTick}
                fontSize={11}
                fontFamily="var(--font-mono)"
                tick={{ fill: "var(--color-text-tertiary)" }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                tickFormatter={formatYTick}
                fontSize={11}
                fontFamily="var(--font-mono)"
                tick={{ fill: "var(--color-text-tertiary)" }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <ReferenceLine y={0} stroke="var(--color-surface-border)" strokeDasharray="3 3" />
              <Tooltip
                formatter={(v: number, name: string, props: any) => [
                  formatAmount({ commodity: name, quantity: props.payload[name + "_abs"] as number }),
                  name,
                ]}
                labelFormatter={formatXTick}
                contentStyle={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-surface-border)",
                  borderRadius: "8px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                }}
              />
              {visible.map((c) => {
                const i = commodities.indexOf(c);
                const [posColor] = COMMODITY_PALETTE[i % COMMODITY_PALETTE.length];
                return (
                  <Area
                    key={c}
                    type="monotone"
                    dataKey={c}
                    stroke={`url(#nwStroke${i})`}
                    strokeWidth={2}
                    fill={`url(#nwFill${i})`}
                    dot={false}
                    activeDot={{ r: 4, fill: posColor, strokeWidth: 0 }}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </StatCard>
  );
}
