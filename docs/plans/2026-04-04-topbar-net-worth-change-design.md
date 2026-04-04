---
date: 2026-04-04
topic: TopBar net worth change badge
status: validated
---

# TopBar: Net Worth Change Badge

## Goal

Replace the `PeriodSavingsRate` badge in the TopBar with a `PeriodNetWorthChange`
badge showing the absolute and percentage change in net worth over the selected period.

## Display

```
↑ +5.2%  ·  +$1,234
```

- Headline: percentage change from start of period `(end − start) / |start| × 100`
- Secondary: absolute change amount
- Green if positive, red if negative (same CSS vars as existing badge)
- Start net worth is zero → show absolute amount only, no percentage
- No data → render nothing

## Architecture

Replace `PeriodSavingsRate` with `PeriodNetWorthChange` in `TopBar`.

```
TopBar
  └── PeriodNetWorthChange
        ├── useAccountRegister("assets",      { from, to, limit: 10000 })
        └── useAccountRegister("liabilities", { from, to, limit: 10000 })
```

Duplicate hook calls with Dashboard are fine — SWR deduplicates identical requests.

## Data Logic

From register entries:
- Keep only last entry per date (dedup by date, same pattern as Dashboard)
- `start` = first entry's balance; `end` = last entry's balance
- `nw(point)` = assets_balance[0].quantity − liabilities_balance[0].quantity
- `change` = end_nw − start_nw
- `pct` = start_nw !== 0 ? (change / Math.abs(start_nw)) * 100 : null

## Changes

- `src/components/TopBar.tsx`: remove `PeriodSavingsRate`, add `PeriodNetWorthChange`, update imports
  - Remove `useIncomeStatement` import (no longer needed)
  - Add `useAccountRegister` import
  - Keep `mergeNetWorthByCommodity` approach but inline the simpler single-commodity logic
