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
          {range.label} &middot; {range.from} — {range.to}
        </p>
      </div>

      {/* Top stat cards row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Net Worth */}
        <StatCard title="Net Worth" className="lg:col-span-1">
          {balanceSheet.isLoading ? (
            <Shimmer className="h-12 w-48" />
          ) : balanceSheet.data ? (
            <div>
              <div className="font-mono text-4xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                {formatMixedAmount(balanceSheet.data.netWorth ?? [])}
              </div>
            </div>
          ) : null}
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
          ) : balanceSheet.data ? (
            <div className="flex items-end gap-2">
              <span className="font-mono text-3xl font-semibold tracking-tight text-[var(--color-loss)]">
                {formatMixedAmount(balanceSheet.data.liabilities?.total ?? [])}
              </span>
              <TrendingDown size={20} className="mb-1 text-[var(--color-loss)]" />
            </div>
          ) : null}
        </StatCard>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Income vs Expenses */}
        <StatCard title="Income vs Expenses">
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
      <StatCard title="Recent Transactions">
        <div className="flex items-center justify-between">
          <div />
          <Link
            to="/transactions"
            className="group -mt-2 flex items-center gap-1 text-xs font-medium text-[var(--color-accent-dim)] transition-colors hover:text-[var(--color-accent)]"
          >
            View all
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        {recentTxns.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => <Shimmer key={i} className="h-10" />)}
          </div>
        ) : recentTxns.data ? (
          <RecentTransactions data={recentTxns.data.data?.flat() ?? []} />
        ) : null}
      </StatCard>
    </div>
  );
}

function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`shimmer ${className}`} />;
}

function IncomeVsExpenses({ data }: { data: any }) {
  const income = Math.abs(data.revenues?.total?.[0]?.quantity ?? 0);
  const expenses = Math.abs(data.expenses?.total?.[0]?.quantity ?? 0);
  const chartData = [{ name: "Period", Income: income, Expenses: expenses }];
  const net = income - expenses;

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
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
      <div className="mt-3 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs font-medium ${net >= 0 ? "bg-[var(--color-gain-dim)] text-[var(--color-gain)]" : "bg-[var(--color-loss-dim)] text-[var(--color-loss)]"}`}>
          {net >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {net >= 0 ? "+" : ""}{formatAmount({ commodity: "$", quantity: net })} net
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
    "var(--color-text-tertiary)",
    "var(--color-surface-3)",
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

function RecentTransactions({ data }: { data: any[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">No transactions found.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--color-surface-border-subtle)] text-left">
          <th className="pb-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Date</th>
          <th className="pb-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Description</th>
          <th className="pb-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Account</th>
          <th className="pb-3 text-right font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Amount</th>
        </tr>
      </thead>
      <tbody>
        {data.map((txn: any, i: number) => {
          const posting = txn.postings?.[0];
          const qty = posting?.amount?.[0]?.quantity ?? 0;
          return (
            <tr key={txn.index ?? i} className="ledger-row border-b border-[var(--color-surface-border-subtle)]/50">
              <td className="py-3 font-mono text-xs text-[var(--color-text-tertiary)]">{txn.date}</td>
              <td className="py-3 font-medium text-[var(--color-text-primary)]">{txn.description}</td>
              <td className="py-3 text-[var(--color-text-tertiary)]">{posting?.account}</td>
              <td className={`py-3 text-right font-mono text-xs font-medium ${qty >= 0 ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"}`}>
                {posting ? formatMixedAmount(posting.amount) : ""}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
