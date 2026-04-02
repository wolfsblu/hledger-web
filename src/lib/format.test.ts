import { describe, it, expect } from "vitest";
import { formatAmount, formatMixedAmount, formatDate } from "./format";

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
