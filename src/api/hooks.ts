import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { components } from "./v1";
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

export function usePayees() {
  return useQuery({
    queryKey: ["payees"],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/payees", {});
      if (error) throw error;
      return data;
    },
  });
}

export function useCommodities() {
  return useQuery({
    queryKey: ["commodities"],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/commodities", {});
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: components["schemas"]["CreateTransactionRequest"]) => {
      const { data, error } = await client.POST("/api/v1/transactions", { body });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useImportRules() {
  return useQuery({
    queryKey: ["import-rules"],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/transactions/import/rules", {});
      if (error) throw error;
      return data;
    },
  });
}

export function useImportCsv() {
  return useMutation({
    mutationFn: async ({ rules, file, dryRun }: { rules: string; file: File; dryRun?: boolean }) => {
      const formData = new FormData();
      formData.append("file", file);
      const url = `/api/v1/transactions/import/${encodeURIComponent(rules)}${dryRun ? "?dryRun=true" : ""}`;
      const response = await fetch(url, { method: "POST", body: formData });
      if (!response.ok) {
        if (response.status === 404) throw new Error(`Rules file "${rules}" not found`);
        throw new Error("Import failed");
      }
      return response.json() as Promise<components["schemas"]["ImportResponse"]>;
    },
  });
}

export function useBulkCreateTransactions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: components["schemas"]["CreateTransactionRequest"][]) => {
      const { data, error } = await client.POST("/api/v1/transactions/bulk", { body });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
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
