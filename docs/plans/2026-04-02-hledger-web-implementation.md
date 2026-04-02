# hledger-web Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a personal finance dashboard SPA that visualizes hledger data from a local API.

**Architecture:** React SPA with Vite, talking directly to hledger API at `http://127.0.0.1:8080`. TanStack Query for server state, openapi-fetch for typed API calls, Recharts for charts. Global date range filter in React context. Dark/light mode with Tailwind.

**Tech Stack:** React 19, Vite, TailwindCSS 4, TanStack Query 5, Recharts 2, React Router 7, openapi-typescript, openapi-fetch, Vitest, React Testing Library

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.gitignore`

**Step 1: Scaffold Vite + React + TypeScript project**

Run:
```bash
npm create vite@latest . -- --template react-ts
```

If prompted about non-empty directory, proceed (only docs/ exists).

**Step 2: Install core dependencies**

Run:
```bash
npm install @tanstack/react-query react-router recharts openapi-fetch date-fns
npm install -D openapi-typescript @tanstack/react-query-devtools @types/react @types/react-dom vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom
```

**Step 3: Configure TailwindCSS 4**

Run:
```bash
npm install tailwindcss @tailwindcss/vite
```

Update `vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8080",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
```

Replace `src/index.css` with:
```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

**Step 4: Create test setup file**

Create `src/test-setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

**Step 5: Create minimal App and entry point**

Replace `src/App.tsx`:
```tsx
export default function App() {
  return <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">hledger-web</div>;
}
```

Replace `src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Step 6: Clean up Vite scaffold files**

Delete: `src/App.css`, `src/assets/react.svg`, `public/vite.svg`. Remove any leftover boilerplate from `index.html` (favicon reference to vite.svg).

**Step 7: Verify it works**

Run: `npm run dev` -- app should load at localhost:5173 showing "hledger-web".
Run: `npx vitest run` -- should pass with zero tests.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + Tailwind project with dependencies"
```

---

### Task 2: API Client & Generated Types

**Files:**
- Create: `src/api/v1.d.ts` (generated), `src/api/client.ts`

**Step 1: Generate TypeScript types from OpenAPI spec**

Run:
```bash
curl -s http://127.0.0.1:8080/openapi.json -o openapi.json
npx openapi-typescript openapi.json -o src/api/v1.d.ts
```

**Step 2: Create the typed API client**

Create `src/api/client.ts`:
```ts
import createClient from "openapi-fetch";
import type { paths } from "./v1";

const client = createClient<paths>({ baseUrl: "/" });

export default client;
```

Note: We use `baseUrl: "/"` because Vite's dev proxy forwards `/api` to the hledger server.

**Step 3: Verify types generated correctly**

Open `src/api/v1.d.ts` and confirm it has `paths` and `components` types matching the API endpoints.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: generate typed API client from OpenAPI spec"
```

---

### Task 3: TanStack Query Hooks

**Files:**
- Create: `src/api/hooks.ts`, `src/api/hooks.test.ts`

**Step 1: Write tests for the query hooks**

Create `src/api/hooks.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";

// Mock the client module
vi.mock("./client", () => ({
  default: {
    GET: vi.fn(),
  },
}));

import client from "./client";
import {
  useAccounts,
  useAccountDetail,
  useAccountBalance,
  useAccountRegister,
  useTransactions,
  useBalanceSheet,
  useIncomeStatement,
} from "./hooks";

const mockedClient = vi.mocked(client);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useAccounts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches accounts list", async () => {
    mockedClient.GET.mockResolvedValueOnce({
      data: [{ name: "assets", fullName: "assets", balance: [{ commodity: "$", quantity: 1000 }], subAccounts: 1, depth: 1 }],
      error: undefined,
      response: {} as Response,
    });

    const { result } = renderHook(() => useAccounts({}), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe("assets");
    expect(mockedClient.GET).toHaveBeenCalledWith("/api/v1/accounts", { params: { query: {} } });
  });
});

describe("useTransactions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches paginated transactions", async () => {
    mockedClient.GET.mockResolvedValueOnce({
      data: { data: [[]], total: 0, limit: 50, offset: 0 },
      error: undefined,
      response: {} as Response,
    });

    const { result } = renderHook(() => useTransactions({ limit: 50, offset: 0 }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedClient.GET).toHaveBeenCalledWith("/api/v1/transactions", {
      params: { query: { limit: 50, offset: 0 } },
    });
  });
});

describe("useBalanceSheet", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches balance sheet report", async () => {
    mockedClient.GET.mockResolvedValueOnce({
      data: { netWorth: [{ commodity: "$", quantity: 5000 }], assets: { rows: [], title: "Assets", total: [] }, liabilities: { rows: [], title: "Liabilities", total: [] }, equity: { rows: [], title: "Equity", total: [] }, date: "2026-04-02" },
      error: undefined,
      response: {} as Response,
    });

    const { result } = renderHook(() => useBalanceSheet({}), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.netWorth).toEqual([{ commodity: "$", quantity: 5000 }]);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/api/hooks.test.ts`
Expected: FAIL -- module `./hooks` not found.

**Step 3: Implement the query hooks**

Create `src/api/hooks.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import client from "./client";

export function useAccounts(params: { depth?: number; type?: string }) {
  return useQuery({
    queryKey: ["accounts", params],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/accounts", {
        params: { query: params },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useAccountDetail(name: string) {
  return useQuery({
    queryKey: ["accounts", name],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/accounts/{name}", {
        params: { path: { name } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!name,
  });
}

export function useAccountBalance(name: string, params: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["accounts", name, "balance", params],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/accounts/{name}/balance", {
        params: { path: { name }, query: params },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!name,
  });
}

export function useAccountRegister(
  name: string,
  params: { from?: string; to?: string; limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: ["accounts", name, "register", params],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/accounts/{name}/register", {
        params: { path: { name }, query: params },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!name,
  });
}

export function useTransactions(params: {
  from?: string;
  to?: string;
  account?: string;
  description?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/transactions", {
        params: { query: params },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useBalanceSheet(params: { date?: string; depth?: number }) {
  return useQuery({
    queryKey: ["balance-sheet", params],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/reports/balance-sheet", {
        params: { query: params },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useIncomeStatement(params: { from?: string; to?: string; depth?: number }) {
  return useQuery({
    queryKey: ["income-statement", params],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/reports/income-statement", {
        params: { query: params },
      });
      if (error) throw error;
      return data;
    },
  });
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/api/hooks.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add TanStack Query hooks for all API endpoints"
```

---

### Task 4: Utility Functions

**Files:**
- Create: `src/lib/format.ts`, `src/lib/format.test.ts`

**Step 1: Write tests for formatting utilities**

Create `src/lib/format.test.ts`:
```ts
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
});

describe("formatDate", () => {
  it("formats ISO date string", () => {
    expect(formatDate("2024-01-15")).toBe("Jan 15, 2024");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/format.test.ts`
Expected: FAIL

**Step 3: Implement formatting utilities**

Create `src/lib/format.ts`:
```ts
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
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/format.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add currency and date formatting utilities"
```

---

### Task 5: Date Range Context

**Files:**
- Create: `src/context/DateRangeContext.tsx`, `src/lib/date-presets.ts`

**Step 1: Create date presets**

Create `src/lib/date-presets.ts`:
```ts
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
```

**Step 2: Create DateRange context**

Create `src/context/DateRangeContext.tsx`:
```tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import { getDefaultRange, type DateRange } from "../lib/date-presets";

interface DateRangeContextValue {
  range: DateRange;
  setRange: (range: DateRange) => void;
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<DateRange>(getDefaultRange);

  return (
    <DateRangeContext.Provider value={{ range, setRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within DateRangeProvider");
  return ctx;
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add date range context with presets"
```

---

### Task 6: Layout Shell (Sidebar, TopBar, Routing)

**Files:**
- Create: `src/components/Sidebar.tsx`, `src/components/TopBar.tsx`, `src/components/DateRangePicker.tsx`, `src/components/DarkModeToggle.tsx`, `src/pages/Dashboard.tsx`, `src/pages/Accounts.tsx`, `src/pages/AccountDetail.tsx`, `src/pages/Transactions.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`

**Step 1: Create placeholder page components**

Create `src/pages/Dashboard.tsx`:
```tsx
export default function Dashboard() {
  return <h1 className="text-2xl font-semibold">Dashboard</h1>;
}
```

Create `src/pages/Accounts.tsx`:
```tsx
export default function Accounts() {
  return <h1 className="text-2xl font-semibold">Accounts</h1>;
}
```

Create `src/pages/AccountDetail.tsx`:
```tsx
import { useParams } from "react-router";

export default function AccountDetail() {
  const { name } = useParams<{ name: string }>();
  return <h1 className="text-2xl font-semibold">Account: {name}</h1>;
}
```

Create `src/pages/Transactions.tsx`:
```tsx
export default function Transactions() {
  return <h1 className="text-2xl font-semibold">Transactions</h1>;
}
```

**Step 2: Create DarkModeToggle**

Create `src/components/DarkModeToggle.tsx`:
```tsx
import { useEffect, useState } from "react";

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function DarkModeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 1118.5 10.5a.75.75 0 01-.232-.036 7 7 0 01-9.575-7.689.75.75 0 01-.238-.771z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}
```

**Step 3: Create DateRangePicker**

Create `src/components/DateRangePicker.tsx`:
```tsx
import { useState, useRef, useEffect } from "react";
import { useDateRange } from "../context/DateRangeContext";
import { getPresets } from "../lib/date-presets";

export default function DateRangePicker() {
  const { range, setRange } = useDateRange();
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(range.from);
  const [customTo, setCustomTo] = useState(range.to);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const presets = getPresets();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-750"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
        </svg>
        {range.label}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Presets
          </div>
          <div className="flex flex-col gap-0.5">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setRange(preset);
                  setOpen(false);
                }}
                className={`rounded px-2 py-1 text-left text-sm ${
                  range.label === preset.label
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Custom Range
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full rounded border border-gray-200 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full rounded border border-gray-200 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
            <button
              onClick={() => {
                setRange({ from: customFrom, to: customTo, label: `${customFrom} - ${customTo}` });
                setOpen(false);
              }}
              className="mt-2 w-full rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Create Sidebar**

Create `src/components/Sidebar.tsx`:
```tsx
import { NavLink } from "react-router";

const links = [
  { to: "/", label: "Dashboard", icon: DashboardIcon },
  { to: "/accounts", label: "Accounts", icon: AccountsIcon },
  { to: "/transactions", label: "Transactions", icon: TransactionsIcon },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="flex h-14 items-center gap-2 px-4">
        <span className="text-lg font-semibold text-gray-900 dark:text-white">hledger</span>
        <span className="text-sm text-gray-400">web</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-2 pt-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200"
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function DashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M2.5 3A1.5 1.5 0 001 4.5v4A1.5 1.5 0 002.5 10h6A1.5 1.5 0 0010 8.5v-4A1.5 1.5 0 008.5 3h-6zm11 2A1.5 1.5 0 0012 6.5v7a1.5 1.5 0 001.5 1.5h4A1.5 1.5 0 0019 13.5v-7A1.5 1.5 0 0017.5 5h-4zm-13 5A1.5 1.5 0 00-.5 11.5v4A1.5 1.5 0 001 17h6a1.5 1.5 0 001.5-1.5v-4A1.5 1.5 0 007 10H1z" clipRule="evenodd" />
    </svg>
  );
}

function AccountsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M1 4.75C1 3.784 1.784 3 2.75 3h14.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0117.25 17H2.75A1.75 1.75 0 011 15.25V4.75zM2.75 4.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h14.5a.25.25 0 00.25-.25V4.75a.25.25 0 00-.25-.25H2.75z" />
    </svg>
  );
}

function TransactionsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M2 3.75A.75.75 0 012.75 3h11.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zm0 4.5A.75.75 0 012.75 7.5h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 012 8.25zm0 4.5a.75.75 0 01.75-.75h11.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
  );
}
```

**Step 5: Create TopBar**

Create `src/components/TopBar.tsx`:
```tsx
import DateRangePicker from "./DateRangePicker";
import DarkModeToggle from "./DarkModeToggle";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 border-b border-gray-200 bg-white/80 px-6 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <DateRangePicker />
      <DarkModeToggle />
    </header>
  );
}
```

**Step 6: Wire up App with routing and layout**

Update `src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DateRangeProvider } from "./context/DateRangeContext";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import AccountDetail from "./pages/AccountDetail";
import Transactions from "./pages/Transactions";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DateRangeProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
            <Sidebar />
            <div className="pl-56">
              <TopBar />
              <main className="p-6">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/accounts/:name" element={<AccountDetail />} />
                  <Route path="/transactions" element={<Transactions />} />
                </Routes>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </DateRangeProvider>
    </QueryClientProvider>
  );
}
```

**Step 7: Verify the layout works**

Run: `npm run dev` -- navigate between pages, toggle dark mode, open date picker.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add layout shell with sidebar, topbar, routing, dark mode, and date picker"
```

---

### Task 7: Dashboard Page

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Create: `src/components/StatCard.tsx`

**Step 1: Create StatCard component**

Create `src/components/StatCard.tsx`:
```tsx
import type { ReactNode } from "react";

export default function StatCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      {children}
    </div>
  );
}
```

**Step 2: Implement Dashboard page**

Replace `src/pages/Dashboard.tsx`:
```tsx
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useDateRange } from "../context/DateRangeContext";
import { useBalanceSheet, useIncomeStatement, useAccounts, useTransactions } from "../api/hooks";
import { formatMixedAmount, formatAmount } from "../lib/format";
import StatCard from "../components/StatCard";
import { Link } from "react-router";

export default function Dashboard() {
  const { range } = useDateRange();
  const balanceSheet = useBalanceSheet({});
  const incomeStatement = useIncomeStatement({ from: range.from, to: range.to, depth: 2 });
  const expenseAccounts = useAccounts({ depth: 2, type: "expense" });
  const recentTxns = useTransactions({ limit: 10 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Net Worth */}
        <StatCard title="Net Worth" className="lg:col-span-2">
          {balanceSheet.isLoading ? (
            <Shimmer />
          ) : balanceSheet.data ? (
            <div className="text-3xl font-bold">
              {formatMixedAmount(balanceSheet.data.netWorth ?? [])}
            </div>
          ) : null}
        </StatCard>

        {/* Income vs Expenses */}
        <StatCard title="Income vs Expenses">
          {incomeStatement.isLoading ? (
            <Shimmer />
          ) : incomeStatement.data ? (
            <IncomeVsExpenses data={incomeStatement.data} />
          ) : null}
        </StatCard>

        {/* Spending by Category */}
        <StatCard title="Spending by Category">
          {expenseAccounts.isLoading ? (
            <Shimmer />
          ) : expenseAccounts.data ? (
            <SpendingByCategory accounts={expenseAccounts.data} />
          ) : null}
        </StatCard>
      </div>

      {/* Recent Transactions */}
      <StatCard title="Recent Transactions">
        {recentTxns.isLoading ? (
          <Shimmer />
        ) : recentTxns.data ? (
          <RecentTransactions data={recentTxns.data.data?.flat() ?? []} />
        ) : null}
      </StatCard>
    </div>
  );
}

function Shimmer() {
  return <div className="h-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />;
}

function IncomeVsExpenses({ data }: { data: any }) {
  const income = Math.abs(data.revenues?.total?.[0]?.quantity ?? 0);
  const expenses = Math.abs(data.expenses?.total?.[0]?.quantity ?? 0);
  const chartData = [{ name: "Period", Income: income, Expenses: expenses }];
  const net = income - expenses;

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200, #e5e7eb)" />
          <XAxis dataKey="name" tick={false} />
          <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} fontSize={12} />
          <Tooltip formatter={(v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
          <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className={`mt-2 text-sm font-medium ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
        {net >= 0 ? "+" : ""}{formatAmount({ commodity: "$", quantity: net })} net
      </p>
    </div>
  );
}

function SpendingByCategory({ accounts }: { accounts: any[] }) {
  const expenses = accounts
    .filter((a: any) => a.fullName !== "expenses" && a.fullName?.startsWith("expenses:"))
    .map((a: any) => ({
      name: a.name,
      amount: Math.abs(a.balance?.[0]?.quantity ?? 0),
    }))
    .sort((a: any, b: any) => b.amount - a.amount)
    .slice(0, 8);

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, expenses.length * 36)}>
      <BarChart data={expenses} layout="vertical" margin={{ left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200, #e5e7eb)" />
        <XAxis type="number" tickFormatter={(v: number) => `$${v.toLocaleString()}`} fontSize={12} />
        <YAxis type="category" dataKey="name" fontSize={12} width={55} />
        <Tooltip formatter={(v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
        <Bar dataKey="amount" fill="#6366f1" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function RecentTransactions({ data }: { data: any[] }) {
  if (data.length === 0) return <p className="text-sm text-gray-500">No transactions found.</p>;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <th className="pb-2">Date</th>
          <th className="pb-2">Description</th>
          <th className="pb-2">Account</th>
          <th className="pb-2 text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {data.map((txn: any, i: number) => {
          const posting = txn.postings?.[0];
          return (
            <tr key={txn.index ?? i} className="border-b border-gray-50 dark:border-gray-800/50">
              <td className="py-2 text-gray-500 dark:text-gray-400">{txn.date}</td>
              <td className="py-2">{txn.description}</td>
              <td className="py-2 text-gray-500 dark:text-gray-400">{posting?.account}</td>
              <td className="py-2 text-right font-mono">
                {posting ? formatMixedAmount(posting.amount) : ""}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

**Step 3: Verify the dashboard renders with live data**

Run: `npm run dev` -- navigate to `/`. Should see net worth, income vs expenses chart, spending by category, and recent transactions.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: implement dashboard with net worth, charts, and recent transactions"
```

---

### Task 8: Accounts Page

**Files:**
- Modify: `src/pages/Accounts.tsx`

**Step 1: Implement Accounts list with tree table**

Replace `src/pages/Accounts.tsx`:
```tsx
import { useState } from "react";
import { Link } from "react-router";
import { useAccounts } from "../api/hooks";
import { formatMixedAmount } from "../lib/format";

export default function Accounts() {
  const { data: accounts, isLoading } = useAccounts({});

  if (isLoading) {
    return <div className="animate-pulse space-y-2">{Array.from({ length: 5 }, (_, i) => <div key={i} className="h-10 rounded bg-gray-100 dark:bg-gray-800" />)}</div>;
  }

  if (!accounts) return null;

  // Group accounts into a tree by top-level parent
  const topLevel = accounts.filter((a: any) => a.depth === 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Accounts</h1>
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {topLevel.map((parent: any) => (
              <AccountSection
                key={parent.fullName}
                parent={parent}
                children={accounts.filter(
                  (a: any) => a.depth > 1 && a.fullName.startsWith(parent.fullName + ":")
                )}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountSection({ parent, children }: { parent: any; children: any[] }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <>
      <tr
        className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-gray-800/30"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-2.5 font-medium">
          <span className="mr-2 inline-block w-4 text-center text-gray-400">
            {expanded ? "−" : "+"}
          </span>
          <Link
            to={`/accounts/${encodeURIComponent(parent.fullName)}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:text-blue-600 dark:hover:text-blue-400"
          >
            {parent.name}
          </Link>
        </td>
        <td className="px-4 py-2.5 text-right font-mono">
          {formatMixedAmount(parent.balance)}
        </td>
      </tr>
      {expanded &&
        children.map((child: any) => (
          <tr
            key={child.fullName}
            className="border-b border-gray-50 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-gray-800/30"
          >
            <td className="px-4 py-2" style={{ paddingLeft: `${child.depth * 1.5}rem` }}>
              <Link
                to={`/accounts/${encodeURIComponent(child.fullName)}`}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                {child.name}
              </Link>
            </td>
            <td className="px-4 py-2 text-right font-mono text-gray-600 dark:text-gray-400">
              {formatMixedAmount(child.balance)}
            </td>
          </tr>
        ))}
    </>
  );
}
```

**Step 2: Verify the accounts page renders**

Run: `npm run dev` -- navigate to `/accounts`. Should show collapsible account tree with balances.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: implement accounts page with collapsible tree table"
```

---

### Task 9: Account Detail Page

**Files:**
- Modify: `src/pages/AccountDetail.tsx`

**Step 1: Implement Account Detail with register and balance chart**

Replace `src/pages/AccountDetail.tsx`:
```tsx
import { useState } from "react";
import { useParams, Link } from "react-router";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAccountDetail, useAccountRegister, useAccountBalance } from "../api/hooks";
import { useDateRange } from "../context/DateRangeContext";
import { formatMixedAmount, formatDate } from "../lib/format";

const PAGE_SIZE = 50;

export default function AccountDetail() {
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name ?? "");
  const { range } = useDateRange();
  const [offset, setOffset] = useState(0);

  const detail = useAccountDetail(decodedName);
  const register = useAccountRegister(decodedName, {
    from: range.from,
    to: range.to,
    limit: PAGE_SIZE,
    offset,
  });
  const balance = useAccountBalance(decodedName, { from: range.from, to: range.to });

  const total = register.data?.total ?? 0;
  const entries = register.data?.entries ?? [];

  const balanceChartData = (balance.data?.history ?? []).map((h: any) => ({
    date: h.date,
    balance: h.balance?.[0]?.quantity ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/accounts" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          &larr; Accounts
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{decodedName}</h1>
        {detail.data && (
          <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            {detail.data.type && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">{detail.data.type}</span>}
            <span>Balance: <span className="font-mono font-medium text-gray-900 dark:text-gray-100">{formatMixedAmount(detail.data.balance ?? [])}</span></span>
          </div>
        )}
      </div>

      {/* Balance Chart */}
      {balanceChartData.length > 1 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Balance Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={balanceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200, #e5e7eb)" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} fontSize={12} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
              <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Register */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Other Account(s)</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {register.isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No entries found.</td></tr>
            ) : (
              entries.map((entry: any, i: number) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{entry.date}</td>
                  <td className="px-4 py-2">{entry.description}</td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                    {(entry.otherAccounts ?? []).join(", ")}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">{formatMixedAmount(entry.amount ?? [])}</td>
                  <td className="px-4 py-2 text-right font-mono">{formatMixedAmount(entry.balance ?? [])}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={offset === 0}
                className="rounded border border-gray-200 px-3 py-1 text-sm disabled:opacity-40 dark:border-gray-700"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={offset + PAGE_SIZE >= total}
                className="rounded border border-gray-200 px-3 py-1 text-sm disabled:opacity-40 dark:border-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify the account detail page renders**

Run: `npm run dev` -- click an account from the Accounts page. Should see detail header, balance chart (if data), and register table.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: implement account detail page with register and balance chart"
```

---

### Task 10: Transactions Page

**Files:**
- Modify: `src/pages/Transactions.tsx`

**Step 1: Implement Transactions page with filters and pagination**

Replace `src/pages/Transactions.tsx`:
```tsx
import { useState, useMemo } from "react";
import { useTransactions } from "../api/hooks";
import { useDateRange } from "../context/DateRangeContext";
import { formatMixedAmount } from "../lib/format";

const PAGE_SIZE = 50;

export default function Transactions() {
  const { range } = useDateRange();
  const [accountFilter, setAccountFilter] = useState("");
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Debounce filter values
  const [debouncedAccount, setDebouncedAccount] = useState("");
  const [debouncedDescription, setDebouncedDescription] = useState("");

  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedAccount(accountFilter);
      setDebouncedDescription(descriptionFilter);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [accountFilter, descriptionFilter]);

  const { data, isLoading } = useTransactions({
    from: range.from,
    to: range.to,
    account: debouncedAccount || undefined,
    description: debouncedDescription || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const transactions = data?.data?.flat() ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Filter by account..."
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
        />
        <input
          type="text"
          placeholder="Filter by description..."
          value={descriptionFilter}
          onChange={(e) => setDescriptionFilter(e.target.value)}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th className="px-4 py-3 w-8"></th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Postings</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No transactions found.</td></tr>
            ) : (
              transactions.map((txn: any) => (
                <TransactionRow
                  key={txn.index}
                  txn={txn}
                  expanded={expandedIndex === txn.index}
                  onToggle={() => setExpandedIndex(expandedIndex === txn.index ? null : txn.index)}
                />
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={offset === 0}
                className="rounded border border-gray-200 px-3 py-1 text-sm disabled:opacity-40 dark:border-gray-700"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={offset + PAGE_SIZE >= total}
                className="rounded border border-gray-200 px-3 py-1 text-sm disabled:opacity-40 dark:border-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const statusIcons: Record<string, string> = {
  cleared: "✓",
  pending: "!",
  unmarked: "",
};

function TransactionRow({
  txn,
  expanded,
  onToggle,
}: {
  txn: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  const firstPosting = txn.postings?.[0];

  return (
    <>
      <tr
        className="cursor-pointer border-b border-gray-50 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-gray-800/30"
        onClick={onToggle}
      >
        <td className="px-4 py-2 text-center text-xs text-gray-400">
          {statusIcons[txn.status] ?? ""}
        </td>
        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{txn.date}</td>
        <td className="px-4 py-2">{txn.description}</td>
        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
          {(txn.postings ?? []).map((p: any) => p.account).join(" → ")}
        </td>
        <td className="px-4 py-2 text-right font-mono">
          {firstPosting ? formatMixedAmount(firstPosting.amount) : ""}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/20">
          <td colSpan={5} className="px-8 py-3">
            <div className="space-y-2 text-sm">
              <table className="w-full">
                <tbody>
                  {(txn.postings ?? []).map((p: any, i: number) => (
                    <tr key={i}>
                      <td className="py-0.5 text-gray-600 dark:text-gray-400">{p.account}</td>
                      <td className="py-0.5 text-right font-mono">{formatMixedAmount(p.amount)}</td>
                      <td className="py-0.5 pl-3 text-xs text-gray-400">{p.status !== "unmarked" ? p.status : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {txn.comment && (
                <p className="text-gray-500 dark:text-gray-400">Comment: {txn.comment}</p>
              )}
              {txn.tags?.length > 0 && (
                <div className="flex gap-1">
                  {txn.tags.map((tag: string, i: number) => (
                    <span key={i} className="rounded bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
```

**Step 2: Verify the transactions page renders**

Run: `npm run dev` -- navigate to `/transactions`. Filter by account/description, expand rows, paginate.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: implement transactions page with filters, pagination, and row expansion"
```

---

### Task 11: Final Polish & Verification

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

**Step 2: Run type checking**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 3: Run the dev server and manually verify all views**

Run: `npm run dev`

Check:
- Dashboard: net worth, income vs expenses chart, spending by category, recent transactions
- Accounts: tree table, collapsible sections, click through to detail
- Account Detail: header, balance chart, register table, pagination
- Transactions: filters, debounced search, pagination, row expansion
- Dark mode toggle works across all pages
- Date range picker presets and custom range work

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final polish and verification"
```
