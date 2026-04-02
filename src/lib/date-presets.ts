import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subYears,
  format,
} from "date-fns";

export interface DateRange {
  from: string;
  to: string;
  label: string;
}

function fmt(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function getPresets(): DateRange[] {
  const now = new Date();
  return [
    { label: "This Month", from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) },
    { label: "Last Month", from: fmt(startOfMonth(subMonths(now, 1))), to: fmt(endOfMonth(subMonths(now, 1))) },
    { label: "This Quarter", from: fmt(startOfQuarter(now)), to: fmt(endOfQuarter(now)) },
    { label: "This Year", from: fmt(startOfYear(now)), to: fmt(endOfYear(now)) },
    { label: "Last Year", from: fmt(startOfYear(subYears(now, 1))), to: fmt(endOfYear(subYears(now, 1))) },
  ];
}

export function getDefaultRange(): DateRange {
  const now = new Date();
  return { label: "This Month", from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) };
}
