import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useDateRange } from "../context/DateRangeContext";
import { useBalanceSheet, useIncomeStatement, useAccounts, useTransactions } from "../api/hooks";
import { formatMixedAmount, formatAmount } from "../lib/format";
import StatCard from "../components/StatCard";
import { LedgerGrid, type ColumnDef } from "../components/LedgerGrid";
import { Link } from "react-router";

export default function Dashboard() {
  const { range } = useDateRange();
  const balanceSheet = useBalanceSheet({});
  const incomeStatement = useIncomeStatement({ from: range.from, to: range.to, depth: 2 });
  const expenseAccounts = useAccounts({ depth: 2, type: "expense" });
  const recentTxns = useTransactions({ limit: 10 });

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

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Income vs Expenses */}
        <StatCard title="Income vs Expenses" stretch>
          {incomeStatement.isLoading ? (
            <Shimmer className="h-52" />
          ) : incomeStatement.data ? (
            <IncomeVsExpenses data={incomeStatement.data} />
          ) : null}
        </StatCard>

        {/* Spending by Category */}
        <StatCard title="Spending by Category">
          {expenseAccounts.isLoading ? (
            <Shimmer className="h-52" />
          ) : expenseAccounts.data ? (
            <SpendingByCategory accounts={expenseAccounts.data} />
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
  const income = Math.abs(
    (data.revenues?.total ?? data.income?.total ?? [])?.[0]?.quantity ?? 0
  );
  const expenses = Math.abs(data.expenses?.total?.[0]?.quantity ?? 0);
  const chartData = [{ name: "Period", Income: income, Expenses: expenses }];
  const net = income - expenses;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1" style={{ minHeight: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barGap={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border-subtle)" vertical={false} />
          <XAxis dataKey="name" tick={false} axisLine={false} />
          <YAxis
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            fontSize={11}
            fontFamily="var(--font-mono)"
            tick={{ fill: "var(--color-text-tertiary)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--color-accent-glow)" }}
            formatter={(v: number) => [`$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, undefined]}
            contentStyle={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "8px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="Income" fill="var(--color-gain)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Expenses" fill="var(--color-loss)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      </div>
      <div className="mt-3 flex shrink-0 items-center gap-3">
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs font-medium ${net >= 0 ? "bg-[var(--color-gain-dim)] text-[var(--color-gain)]" : "bg-[var(--color-loss-dim)] text-[var(--color-loss)]"}`}>
          {net >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {net >= 0 ? "+" : ""}{formatAmount({ commodity: "$", quantity: net })} net
        </span>
        <span className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-text-tertiary)]">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-gain)]" />
          Income: {formatAmount({ commodity: "$", quantity: income })}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-text-tertiary)]">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-loss)]" />
          Expenses: {formatAmount({ commodity: "$", quantity: expenses })}
        </span>
      </div>
    </div>
  );
}

function SpendingByCategory({ accounts }: { accounts: any[] }) {
  const expenses = accounts
    .filter((a: any) => a.fullName !== "expenses" && a.fullName?.startsWith("expenses:"))
    .map((a: any) => ({
      name: a.name,
      amount: Math.abs(a.balance?.[0]?.quantity ?? 0),
    }))
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
              ${exp.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
