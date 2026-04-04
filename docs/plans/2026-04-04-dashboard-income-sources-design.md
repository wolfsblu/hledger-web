---
date: 2026-04-04
topic: Dashboard layout restructure + Top Income Sources widget
status: validated
---

# Dashboard: Layout Restructure + Top Income Sources

## Goal

Resolve the awkward height mismatch in the charts row where a static-height
Income vs Expenses widget sits next to a dynamic-height Spending by Category
widget.

## New Layout Order

```
[Net Worth] [Total Assets] [Total Liabilities]   3-col stat cards (unchanged)
[Net Worth Over Time]                             full-width chart (unchanged)
[Income vs Expenses]                              full-width (moved here)
[Top Income Sources] [Spending by Category]       2-col dynamic pair (new)
[Recent Transactions]                             full-width (unchanged)
```

## Changes

### 1. Move Income vs Expenses to full-width

- Remove from the 2-col grid
- Place as its own full-width `StatCard` between the Net Worth chart and the new dynamic pair
- Drop the `stretch` prop (no longer needed to fill a column)

### 2. Add Top Income Sources widget

**Data source:** `incomeStatement.data.revenues?.rows ?? incomeStatement.data.income?.rows ?? []`
- Already fetched via `useIncomeStatement` — no new API calls

**Processing:**
- Filter out the root-level `revenues`/`income` account row
- `amount = Math.abs(quantity)` (income is stored negative in hledger)
- Sort descending by amount
- Cap at 8 rows

**Rendering:**
- Identical structure to `SpendingByCategory`: label + mono amount + colored horizontal bar
- Same chart color palette (`var(--color-chart-*)`)
- Empty state: "No income data found."

### 3. Two-col dynamic pair

```tsx
<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
  <StatCard title="Top Income Sources">
    <IncomeBySource rows={incomeStatement.data.revenues?.rows ?? ...} />
  </StatCard>
  <StatCard title="Spending by Category">
    <SpendingByCategory rows={incomeStatement.data.expenses?.rows ?? []} />
  </StatCard>
</div>
```

Heights will naturally differ if income vs expense account counts differ — this
is acceptable; it reflects real data rather than forced symmetry.

## Non-goals

- No new API calls
- No budget/goal tracking
- No percentage-of-total column (kept simple like SpendingByCategory)
