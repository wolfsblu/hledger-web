import { describe, it, expect } from "vitest";
import { formatAmount, formatMixedAmount, formatDate, mergeNetWorthHistory } from "./format";

describe("formatAmount", () => {
  it("formats positive USD", () => {
    expect(formatAmount({ commodity: "$", quantity: 1234.56 })).toBe("$1,234.56");
  });

  it("formats negative USD", () => {
    expect(formatAmount({ commodity: "$", quantity: -500 })).toBe("-$500.00");
  });

  it("formats zero", () => {
    expect(formatAmount({ commodity: "$", quantity: 0 })).toBe("$0.00");
  });

  it("formats non-dollar commodity", () => {
    expect(formatAmount({ commodity: "EUR", quantity: 100 })).toBe("100.00 EUR");
  });
});

describe("formatMixedAmount", () => {
  it("formats single amount", () => {
    expect(formatMixedAmount([{ commodity: "$", quantity: 100 }])).toBe("$100.00");
  });

  it("formats multiple amounts", () => {
    expect(
      formatMixedAmount([
        { commodity: "$", quantity: 100 },
        { commodity: "EUR", quantity: 50 },
      ])
    ).toBe("$100.00, 50.00 EUR");
  });

  it("formats empty array", () => {
    expect(formatMixedAmount([])).toBe("$0.00");
  });

  it("merges duplicate commodities", () => {
    expect(
      formatMixedAmount([
        { commodity: "$", quantity: 500 },
        { commodity: "$", quantity: 200 },
      ])
    ).toBe("$700.00");
  });
});

describe("formatDate", () => {
  it("formats ISO date string", () => {
    expect(formatDate("2024-01-15")).toBe("Jan 15, 2024");
  });
});

describe("mergeNetWorthHistory", () => {
  it("merges aligned date series", () => {
    const assets = [
      { date: "2026-01-01", balance: [{ commodity: "$", quantity: 1000 }] },
      { date: "2026-02-01", balance: [{ commodity: "$", quantity: 1200 }] },
    ];
    const liabilities = [
      { date: "2026-01-01", balance: [{ commodity: "$", quantity: -200 }] },
      { date: "2026-02-01", balance: [{ commodity: "$", quantity: -300 }] },
    ];
    expect(mergeNetWorthHistory(assets, liabilities)).toEqual([
      { date: "2026-01-01", netWorth: 800 },
      { date: "2026-02-01", netWorth: 900 },
    ]);
  });

  it("forward-fills missing dates", () => {
    const assets = [
      { date: "2026-01-01", balance: [{ commodity: "$", quantity: 1000 }] },
      { date: "2026-03-01", balance: [{ commodity: "$", quantity: 1500 }] },
    ];
    const liabilities = [
      { date: "2026-02-01", balance: [{ commodity: "$", quantity: -200 }] },
    ];
    expect(mergeNetWorthHistory(assets, liabilities)).toEqual([
      { date: "2026-01-01", netWorth: 1000 },
      { date: "2026-02-01", netWorth: 800 },
      { date: "2026-03-01", netWorth: 1300 },
    ]);
  });

  it("returns empty array when both inputs are empty", () => {
    expect(mergeNetWorthHistory([], [])).toEqual([]);
  });

  it("sums multi-commodity balances by first commodity only (primary commodity)", () => {
    const assets = [
      { date: "2026-01-01", balance: [{ commodity: "$", quantity: 500 }, { commodity: "$", quantity: 300 }] },
    ];
    expect(mergeNetWorthHistory(assets, [])).toEqual([
      { date: "2026-01-01", netWorth: 800 },
    ]);
  });
});
