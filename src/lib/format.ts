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

  return Array.from(merged, ([commodity, quantity]) =>
    formatAmount({ commodity, quantity })
  ).join(", ");
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d, yyyy");
}
