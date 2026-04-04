---
date: 2026-04-04
topic: Mobile Ledger List
status: approved
---

# Mobile Ledger List Design

## Problem

The `LedgerGrid` component uses a CSS grid with fixed-width columns (`7rem`, `max-content`, `1fr`). On mobile screens this overflows horizontally, making the transactions page unusable.

## Approach

Render a separate mobile list component below the `md` breakpoint. The desktop `LedgerGrid` is hidden on mobile via `hidden md:grid`. No changes to `LedgerGrid.tsx`.

## Layout

### Breakpoints
- `< md`: `MobileLedgerList`
- `>= md`: `LedgerGrid` (unchanged)

### Row Structure (collapsed)

```
┌─ 3px bar ──────────────────────────────────────────┐
│  Description (truncated)          Amount (± color) │
│  2026-01-15 · expenses:food                    ›   │
└────────────────────────────────────────────────────┘
```

- **Left edge**: 3px vertical colored bar — `var(--color-gain)` for positive, `var(--color-loss)` for negative amount
- **Top line**: description (`truncate`, `font-medium`) + amount right-aligned in gain/loss color
- **Bottom line**: date (`font-mono text-xs text-tertiary`) + `·` + account name (truncated, muted)
- **Chevron**: right side between lines, rotates 90° when expanded
- **Tap target**: full row width

### Row Structure (expanded)

Tapping reveals `<TransactionDetail>` inline below the row — same component as desktop, reused unchanged.

### Container

Same outer card as desktop: `rounded-xl border border-surface-border-subtle bg-surface-1`. Rows separated by subtle border.

## Component Structure

No new files. All components added to bottom of `Transactions.tsx`:

```
Transactions (page)
├── Search bar (shared)
├── desktop: <LedgerGrid> hidden on mobile via `hidden md:block`
├── mobile: <MobileLedgerList> shown on mobile via `md:hidden`
│   └── MobileLedgerRow (per transaction)
│       ├── collapsed: two-line row
│       └── expanded: <TransactionDetail> (unchanged)
└── Pagination (shared)
```

## What Does Not Change

- `LedgerGrid.tsx` — untouched
- `TransactionDetail` — reused as-is
- Search, pagination, date range filtering — all shared
- Desktop layout — identical to current
