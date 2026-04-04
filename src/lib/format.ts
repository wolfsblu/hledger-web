import { format, parseISO } from "date-fns";

export interface Amount {
  commodity: string;
  quantity: number;
}

export function formatAmount(amount: Amount): string {
  const { commodity, quantity } = amount;
  const absFormatted = Math.abs(quantity).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (commodity === "$" || commodity === "USD") {
    const sign = quantity < 0 ? "-" : "";
    return `${sign}$${absFormatted}`;
  }

  const sign = quantity < 0 ? "-" : "";
  return `${sign}${absFormatted} ${commodity}`;
}

export function formatMixedAmount(amounts: Amount[]): string {
  if (amounts.length === 0) return "$0.00";

  // Merge entries that share the same commodity (hledger can return
  // multiple entries for one commodity when cost bases differ).
  const merged = new Map<string, number>();
  for (const { commodity, quantity } of amounts) {
    merged.set(commodity, (merged.get(commodity) ?? 0) + quantity);
  }

  const entries = Array.from(merged, ([commodity, quantity]) => ({ commodity, quantity }));
  const nonZero = entries.filter(e => e.quantity !== 0);
  const toFormat = nonZero.length > 0 ? nonZero : entries.slice(0, 1);
  return toFormat.map(e => formatAmount(e)).join(", ");
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d, yyyy");
}

export interface BalanceItem {
  date: string;
  balance: Amount[];
}

export function mergeNetWorthHistory(
  assets: BalanceItem[],
  liabilities: BalanceItem[]
): { date: string; netWorth: number }[] {
  if (assets.length === 0 && liabilities.length === 0) return [];

  const dateSet = new Set([
    ...assets.map((b) => b.date),
    ...liabilities.map((b) => b.date),
  ]);
  const dates = Array.from(dateSet).sort();

  const assetMap = new Map(assets.map((b) => [b.date, b.balance]));
  const liabMap = new Map(liabilities.map((b) => [b.date, b.balance]));

  const sumBalance = (bal: Amount[]): number =>
    bal.reduce((acc, a) => acc + a.quantity, 0);

  let lastAsset = 0;
  let lastLiab = 0;

  return dates.map((date) => {
    if (assetMap.has(date)) lastAsset = sumBalance(assetMap.get(date)!);
    if (liabMap.has(date)) lastLiab = sumBalance(liabMap.get(date)!);
    return { date, netWorth: lastAsset + lastLiab };
  });
}

export function mergeNetWorthByCommodity(
  assets: BalanceItem[],
  liabilities: BalanceItem[]
): { series: { date: string; [commodity: string]: number | string }[]; commodities: string[] } {
  if (assets.length === 0 && liabilities.length === 0) return { series: [], commodities: [] };

  const dateSet = new Set([...assets.map((b) => b.date), ...liabilities.map((b) => b.date)]);
  const dates = Array.from(dateSet).sort();

  const commoditySet = new Set<string>();
  for (const b of [...assets, ...liabilities])
    for (const a of b.balance) if (a.commodity) commoditySet.add(a.commodity);
  const commodities = Array.from(commoditySet);

  const buildMap = (items: BalanceItem[]) => {
    const map = new Map<string, Map<string, number>>();
    for (const b of items) {
      const cMap = new Map<string, number>();
      for (const a of b.balance) cMap.set(a.commodity, (cMap.get(a.commodity) ?? 0) + a.quantity);
      map.set(b.date, cMap);
    }
    return map;
  };

  const assetMap = buildMap(assets);
  const liabMap = buildMap(liabilities);
  const lastAsset = new Map<string, number>(commodities.map((c) => [c, 0]));
  const lastLiab = new Map<string, number>(commodities.map((c) => [c, 0]));

  const series = dates.map((date) => {
    if (assetMap.has(date)) for (const [c, q] of assetMap.get(date)!) lastAsset.set(c, q);
    if (liabMap.has(date))  for (const [c, q] of liabMap.get(date)!)  lastLiab.set(c, q);
    const entry: { date: string; [c: string]: number | string } = { date };
    for (const c of commodities) entry[c] = (lastAsset.get(c) ?? 0) + (lastLiab.get(c) ?? 0);
    return entry;
  });

  return { series, commodities };
}
