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
