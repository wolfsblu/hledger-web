import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useDebounce } from "./useDebounce";

export type TransactionStatus = "cleared" | "pending" | "unmarked";

const ALL_STATUSES: TransactionStatus[] = ["cleared", "pending", "unmarked"];

export interface TransactionFilters {
  selectedAccounts: Set<string>;
  description: string;
  statuses: Set<TransactionStatus>;
  selectedTags: Set<string>;
  minAmount: string;
  maxAmount: string;

  accountParam: string[] | undefined;
  debouncedDescription: string;
  debouncedMinAmount: number | undefined;
  debouncedMaxAmount: number | undefined;
  statusParam: string[] | undefined;
  tagParam: string[] | undefined;

  toggleAccount: (v: string) => void;
  setDescription: (v: string) => void;
  toggleStatus: (s: TransactionStatus) => void;
  toggleTag: (tag: string) => void;
  setMinAmount: (v: string) => void;
  setMaxAmount: (v: string) => void;
  clearAll: () => void;

  activeCount: number;
  hasActiveFilters: boolean;
}

export function useTransactionFilters(onServerParamsChange: () => void): TransactionFilters {
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(() => new Set());
  const [description, setDescription] = useState("");
  const [statuses, setStatuses] = useState<Set<TransactionStatus>>(
    () => new Set(ALL_STATUSES),
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(() => new Set());
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const debouncedDescription = useDebounce(description, 300);
  const debouncedMin = useDebounce(minAmount, 300);
  const debouncedMax = useDebounce(maxAmount, 300);

  const debouncedMinAmount = debouncedMin !== "" ? Number(debouncedMin) : undefined;
  const debouncedMaxAmount = debouncedMax !== "" ? Number(debouncedMax) : undefined;

  const accountParam = useMemo(
    () => (selectedAccounts.size === 0 ? undefined : [...selectedAccounts]),
    [selectedAccounts],
  );

  const deselectedStatusCount = ALL_STATUSES.length - statuses.size;
  const statusParam = useMemo(
    () => (deselectedStatusCount === 0 ? undefined : [...statuses] as string[]),
    [statuses, deselectedStatusCount],
  );

  const tagParam = useMemo(
    () => (selectedTags.size === 0 ? undefined : [...selectedTags]),
    [selectedTags],
  );

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onServerParamsChange();
  }, [accountParam, debouncedDescription, debouncedMinAmount, debouncedMaxAmount, statusParam, tagParam, onServerParamsChange]);

  const toggleAccount = useCallback((name: string) => {
    setSelectedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const toggleStatus = useCallback((s: TransactionStatus) => {
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) {
        next.delete(s);
      } else {
        next.add(s);
      }
      return next;
    });
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedAccounts(new Set());
    setDescription("");
    setStatuses(new Set(ALL_STATUSES));
    setSelectedTags(new Set());
    setMinAmount("");
    setMaxAmount("");
  }, []);

  const activeCount =
    selectedAccounts.size +
    (description ? 1 : 0) +
    deselectedStatusCount +
    selectedTags.size +
    (minAmount ? 1 : 0) +
    (maxAmount ? 1 : 0);

  return {
    selectedAccounts,
    description,
    statuses,
    selectedTags,
    minAmount,
    maxAmount,
    accountParam,
    debouncedDescription,
    debouncedMinAmount,
    debouncedMaxAmount,
    statusParam,
    tagParam,
    toggleAccount,
    setDescription,
    toggleStatus,
    toggleTag,
    setMinAmount,
    setMaxAmount,
    clearAll,
    activeCount,
    hasActiveFilters: activeCount > 0,
  };
}
