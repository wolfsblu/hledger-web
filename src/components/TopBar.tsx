import { Menu, TrendingUp, TrendingDown } from "lucide-react";
import DateRangePicker from "./DateRangePicker";
import DarkModeToggle from "./DarkModeToggle";
import { useDateRange } from "../context/DateRangeContext";
import { useAccountRegister } from "../api/hooks";
import { formatAmount } from "../lib/format";

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-0)]/90 px-8 backdrop-blur-xl">
      <button
        onClick={onMenuClick}
        className="lg:hidden -ml-2 rounded-lg p-2 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <PeriodNetWorthChange />
        <DateRangePicker />
        <div className="h-5 w-px bg-[var(--color-surface-border)]" />
        <DarkModeToggle />
      </div>
    </header>
  );
}

function PeriodNetWorthChange() {
  const { range } = useDateRange();
  const assets = useAccountRegister("assets", { from: range.from, to: range.to, limit: 10000 });
  const liabilities = useAccountRegister("liabilities", { from: range.from, to: range.to, limit: 10000 });
  // Opening balance: all history up to (not including) the period start
  const openingAssets = useAccountRegister("assets", { to: range.from, limit: 10000 });
  const openingLiabilities = useAccountRegister("liabilities", { to: range.from, limit: 10000 });

  if (
    assets.isLoading || liabilities.isLoading ||
    openingAssets.isLoading || openingLiabilities.isLoading ||
    !assets.data || !liabilities.data
  ) return null;

  const assetEntries = assets.data.entries ?? [];
  const liabEntries = liabilities.data.entries ?? [];

  if (assetEntries.length === 0 && liabEntries.length === 0) return null;

  const commodity =
    assetEntries[0]?.amount?.[0]?.commodity ??
    liabEntries[0]?.amount?.[0]?.commodity ??
    openingAssets.data?.entries?.[0]?.balance?.[0]?.commodity ??
    "$";

  // Last balance entry for a set of register entries (used for pre-period historical balance)
  const lastBalance = (entries: NonNullable<typeof openingAssets.data>["entries"] | undefined) => {
    const byDate = new Map<string, NonNullable<typeof entries>[number]>();
    for (const e of entries ?? []) if (e.date && e.balance) byDate.set(e.date, e);
    const sorted = Array.from(byDate.values()).sort((a, b) => a.date!.localeCompare(b.date!));
    return sorted[sorted.length - 1]?.balance?.find((a) => a.commodity === commodity)?.quantity ?? 0;
  };

  // Sum of posting amounts in period = net flow for this account (same commodity)
  const sumAmounts = (entries: typeof assetEntries) =>
    entries.reduce((acc, e) => acc + (e.amount?.find((a) => a.commodity === commodity)?.quantity ?? 0), 0);

  const change = sumAmounts(assetEntries) + sumAmounts(liabEntries);
  if (change === 0) return null;

  // Opening net worth = last balance before the period started (true historical basis for percentage)
  const startNw =
    lastBalance(openingAssets.data?.entries) +
    lastBalance(openingLiabilities.data?.entries);

  const pct = Math.abs(startNw) >= 1 ? Math.round((change / Math.abs(startNw)) * 100) : null;
  const isPositive = change >= 0;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-sm font-medium ${
        isPositive
          ? "border-[var(--color-gain-dim)] bg-[var(--color-gain-dim)] text-[var(--color-gain)]"
          : "border-[var(--color-loss-dim)] bg-[var(--color-loss-dim)] text-[var(--color-loss)]"
      }`}
    >
      {isPositive ? <TrendingUp size={13} strokeWidth={2} /> : <TrendingDown size={13} strokeWidth={2} />}
      {pct !== null && <span>{isPositive ? "+" : ""}{pct}%</span>}
      {pct !== null && <span className="opacity-40">·</span>}
      <span>{isPositive ? "+" : ""}{formatAmount({ commodity, quantity: change })}</span>
    </div>
  );
}
