# hledger-web: Personal Finance Dashboard

## Overview

A single-page application for visualizing hledger data. Connects to the hledger API at `http://127.0.0.1:8080`. No backend-for-frontend, no auth -- it is a local tool.

## Tech Stack

- **React + Vite** -- SPA framework and build tool
- **TailwindCSS** -- Utility-first styling with dark mode (`class` strategy)
- **TanStack Query** -- Server state management, caching, refetching
- **Recharts** -- Charting library
- **React Router** -- Client-side routing
- **openapi-typescript + openapi-fetch** -- Typed API client generated from the OpenAPI spec
- **React Hook Form** -- To be added later when create/update operations are needed

## API

The hledger API (OpenAPI 3.0) provides:

- `GET /api/v1/accounts` -- List accounts with balances (filterable by depth, type)
- `GET /api/v1/accounts/{name}` -- Account detail
- `GET /api/v1/accounts/{name}/balance` -- Balance history (from/to)
- `GET /api/v1/accounts/{name}/register` -- Account register with pagination
- `GET /api/v1/transactions` -- Paginated transactions (filterable by date, account, description)
- `GET /api/v1/transactions/{index}` -- Single transaction
- `GET /api/v1/reports/balance-sheet` -- Assets, liabilities, equity, net worth
- `GET /api/v1/reports/income-statement` -- Revenue vs expenses
- `GET /api/v1/reports/cash-flow` -- Operating, investing, financing flows
- `GET /api/v1/commodities` -- Currency/commodity list
- `GET /api/v1/payees` -- Payee list
- `GET /api/v1/tags` -- Tag list
- `GET /api/v1/version` -- API and hledger version

## Architecture

### Routing

| Path | View |
|---|---|
| `/` | Dashboard |
| `/accounts` | Account list (tree table) |
| `/accounts/:name` | Account detail with register |
| `/transactions` | Transaction list |

### Layout

Persistent sidebar nav (left, ~220px) + top bar with global date range filter and dark mode toggle. Main content area scrolls independently. Sidebar collapses to icons on smaller screens.

### State Management

- **Server state:** TanStack Query handles all API data -- fetching, caching, background refetching.
- **Global date range:** React context. All views subscribe to it. Default: current month.
- **Dark mode:** Toggle stored in `localStorage`, system preference detected on first visit. Tailwind `class` strategy on `<html>`.

### API Client

Types generated from the OpenAPI spec using `openapi-typescript`. Requests made via `openapi-fetch` (typed, thin fetch wrapper). Custom TanStack Query hooks wrap each endpoint (e.g. `useAccounts()`, `useTransactions()`).

### Project Structure

```
src/
  api/          # generated types, openapi-fetch client, query hooks
  components/   # shared UI (Sidebar, TopBar, DateRangePicker, DataTable)
  pages/        # Dashboard, Accounts, AccountDetail, Transactions
  context/      # DateRangeContext
  lib/          # formatting utils (currency, dates)
  App.tsx       # router + layout shell
```

## Views

### Dashboard (`/`)

Four cards on a single scrollable page. All respect the global date range.

1. **Net Worth** -- Current net worth (from balance sheet `netWorth`) with a sparkline trend over the last 12 months. Built from `/accounts/assets/balance` and `/accounts/liabilities/balance` with monthly date ranges.

2. **Income vs Expenses** -- Side-by-side monthly bar chart for the last 6 months. Data from `/reports/income-statement` per month. Hover shows exact amounts. Delta line below: "+$X net" or "-$X net" for the current month.

3. **Spending by Category** -- Horizontal bar chart showing top 8 expense sub-accounts for the selected range. Uses `/accounts?type=expense&depth=2`. Remaining categories grouped as "Other".

4. **Recent Transactions** -- Compact table of the last 10 transactions (`/transactions?limit=10`). Columns: date, description, primary account, amount. Rows link to the Transactions view.

### Accounts (`/accounts`)

**List view:** Tree table showing the account hierarchy. Columns: account name (indented by depth), balance. Top-level accounts are collapsible sections. Uses `/accounts` with no depth limit. Clicking a name navigates to detail.

**Detail view (`/accounts/:name`):** Header with full account name, current balance, account type. Balance over time line chart from `/accounts/{name}/balance`. Register table below: date, description, other account(s), amount, running balance. Paginated (50 per page) via API `limit`/`offset`.

### Transactions (`/transactions`)

Full-width data table. Columns: date, status icon (cleared/pending/unmarked), description, postings (account + amount), total amount.

**Filtering:** Filter bar with account text input (`?account=`) and description search (`?description=`). 300ms debounce. Global date range inherited from top bar.

**Pagination:** Prev/next at bottom, "showing 1-50 of N". Uses API `limit=50` and `offset`.

**Row expansion:** Click a row to expand inline showing all postings, comment, tags, and status.

## Visual Style

Clean and minimal. Lots of whitespace, muted colors, thin borders. Dark and light modes with toggle. System preference detected on first visit.

## Future Work

- Create and update operations (React Hook Form)
- Balance Sheet, Income Statement, Cash Flow report pages
- Period comparison (e.g. this month vs last month)
