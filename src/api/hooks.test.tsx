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
  useTransactions,
  useBalanceSheet,
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
