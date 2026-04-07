import { useState, useRef, useEffect, useMemo } from "react";
import { Check, AlertCircle, Search, Tag, X, Wallet, DollarSign } from "lucide-react";
import type { TransactionFilters, TransactionStatus } from "../hooks/useTransactionFilters";
import { useAccounts, useTags } from "../api/hooks";
import type { components } from "../api/v1";

const statusOptions: {
  value: TransactionStatus;
  label: string;
  icon: React.ComponentType<{ size?: number }> | null;
  activeClass: string;
}[] = [
  { value: "cleared", label: "Cleared", icon: Check, activeClass: "text-[var(--color-gain)]" },
  { value: "pending", label: "Pending", icon: AlertCircle, activeClass: "text-[var(--color-accent)]" },
  { value: "unmarked", label: "Unmarked", icon: null, activeClass: "text-[var(--color-text-primary)]" },
];

interface Props {
  filters: TransactionFilters;
}

type AccountTree = components["schemas"]["AccountTree"];

function flattenAccounts(trees: AccountTree[]): string[] {
  const result: string[] = [];
  function walk(nodes: AccountTree[]) {
    for (const node of nodes) {
      result.push(node.fullName);
      if (node.children?.length) walk(node.children);
    }
  }
  walk(trees);
  return result;
}

export default function TransactionFilterPanel({ filters }: Props) {
  const { data: accountTree } = useAccounts({});
  const { data: tags } = useTags();

  const accountNames = useMemo(
    () => (accountTree ? flattenAccounts(accountTree) : []),
    [accountTree],
  );

  return (
    <div className="space-y-3">
      {/* Filter rows — stacked on mobile, single row on lg */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        {/* Description input + clear filters */}
        <div className="relative min-w-0 lg:flex-1 lg:basis-40">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="Description..."
            value={filters.description}
            onChange={(e) => filters.setDescription(e.target.value)}
            className={`h-9 w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] pl-8 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-colors focus:border-[var(--color-accent-dim)] focus:outline-none ${filters.hasActiveFilters ? "pr-20" : "pr-3"}`}
          />
          {filters.hasActiveFilters && (
            <button
              onClick={filters.clearAll}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              Clear
              <X size={11} className="shrink-0 translate-y-px" />
            </button>
          )}
        </div>

        {/* Divider — vertical on desktop, hidden on mobile */}
        <div className="hidden h-6 w-px bg-[var(--color-surface-border)] lg:block" />

        {/* Pickers */}
        <div className="grid grid-cols-3 gap-2 lg:flex lg:items-center lg:gap-2">
          <MultiSelectPicker
            icon={<Wallet size={13} />}
            label="Accounts"
            items={accountNames}
            selected={filters.selectedAccounts}
            onToggle={filters.toggleAccount}
            emptyMessage="No accounts found"
            className="w-full lg:w-auto"
          />
          <MultiSelectPicker
            icon={<Tag size={13} />}
            label="Tags"
            items={tags ?? []}
            selected={filters.selectedTags}
            onToggle={filters.toggleTag}
            emptyMessage="No tags in journal"
            className="w-full lg:w-auto"
            renderItem={(tag) => {
              const colonIdx = tag.indexOf(":");
              if (colonIdx === -1) return tag;
              return (
                <>
                  <span className="text-[var(--color-text-tertiary)]">{tag.slice(0, colonIdx)}:</span>
                  {tag.slice(colonIdx + 1)}
                </>
              );
            }}
          />
          <AmountPicker filters={filters} className="w-full lg:w-auto" />
        </div>

        {/* Divider — vertical on desktop, hidden on mobile */}
        <div className="hidden h-6 w-px bg-[var(--color-surface-border)] lg:block" />

        {/* Status */}
        <div className="flex h-9 gap-0.5 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] p-0.5">
          {statusOptions.map((opt) => {
            const active = filters.statuses.has(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => filters.toggleStatus(opt.value)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all lg:flex-none ${
                  active
                    ? `bg-[var(--color-surface-1)] ${opt.activeClass} shadow-sm`
                    : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                }`}
                title={opt.label}
              >
                {opt.icon ? (
                  <opt.icon size={11} />
                ) : (
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                )}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
}

function MultiSelectPicker({
  icon,
  label,
  items,
  selected,
  onToggle,
  emptyMessage,
  renderItem,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
  selected: Set<string>;
  onToggle: (item: string) => void;
  emptyMessage: string;
  renderItem?: (item: string) => React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = search
    ? items.filter((t) => t.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors ${
          selected.size > 0
            ? "border-[var(--color-accent-dim)] bg-[var(--color-accent-glow)] text-[var(--color-text-primary)]"
            : "border-[var(--color-surface-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
        } ${className ?? ""}`}
      >
        {icon}
        {label}
        {selected.size > 0 && (
          <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold leading-none text-white">
            {selected.size}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-fade-up absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-1)] shadow-2xl shadow-black/20">
          <div className="border-b border-[var(--color-surface-border)] p-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full rounded-lg bg-[var(--color-surface-2)] py-1.5 pl-7 pr-2 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-[var(--color-text-tertiary)]">
                {items.length === 0 ? emptyMessage : "No matches"}
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = selected.has(item);
                return (
                  <button
                    key={item}
                    onClick={() => onToggle(item)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-[var(--color-accent-glow)] text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        isSelected
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                          : "border-[var(--color-surface-3)]"
                      }`}
                    >
                      {isSelected && <Check size={10} className="text-white" />}
                    </span>
                    <span className="min-w-0 truncate font-medium">
                      {renderItem ? renderItem(item) : item}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AmountPicker({ filters, className }: { filters: TransactionFilters; className?: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const hasValue = filters.minAmount !== "" || filters.maxAmount !== "";

  let summary = "";
  if (filters.minAmount && filters.maxAmount) {
    summary = `${filters.minAmount} – ${filters.maxAmount}`;
  } else if (filters.minAmount) {
    summary = `≥ ${filters.minAmount}`;
  } else if (filters.maxAmount) {
    summary = `≤ ${filters.maxAmount}`;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors ${
          hasValue
            ? "border-[var(--color-accent-dim)] bg-[var(--color-accent-glow)] text-[var(--color-text-primary)]"
            : "border-[var(--color-surface-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
        } ${className ?? ""}`}
      >
        <DollarSign size={13} />
        {hasValue ? (
          <span className="font-mono text-xs">{summary}</span>
        ) : (
          "Amount"
        )}
      </button>

      {open && (
        <div className="animate-fade-up absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-1)] p-3 shadow-2xl shadow-black/20">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                Minimum
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => filters.setMinAmount(e.target.value)}
                autoFocus
                className="h-9 w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] px-3 font-mono text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-colors focus:border-[var(--color-accent-dim)] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                Maximum
              </label>
              <input
                type="number"
                placeholder="Any"
                value={filters.maxAmount}
                onChange={(e) => filters.setMaxAmount(e.target.value)}
                className="h-9 w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] px-3 font-mono text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-colors focus:border-[var(--color-accent-dim)] focus:outline-none"
              />
            </div>
            {hasValue && (
              <button
                onClick={() => {
                  filters.setMinAmount("");
                  filters.setMaxAmount("");
                }}
                className="w-full text-center text-xs font-medium text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                Clear range
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
