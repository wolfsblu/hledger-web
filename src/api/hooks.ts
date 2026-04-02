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
