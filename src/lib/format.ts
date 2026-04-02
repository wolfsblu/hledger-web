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
  return amounts.map(formatAmount).join(", ");
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d, yyyy");
}
