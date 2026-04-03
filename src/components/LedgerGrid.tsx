import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface ColumnDef<T> {
  id: string;
  header: ReactNode;
  width: string; // CSS grid track: "7rem", "1fr", "max-content", etc.
  headerClass?: string;
  cellClass?: string;
  render: (row: T) => ReactNode;
}

interface LedgerGridProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => React.Key;
  renderExpanded?: (row: T) => ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
}

const HEADER = "border-b border-[var(--color-surface-border)] py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]";

export function LedgerGrid<T>({
  columns,
  rows,
  rowKey,
  renderExpanded,
  isLoading,
  emptyMessage = "No results found.",
}: LedgerGridProps<T>) {
  const expandable = !!renderExpanded;
  const colCount = expandable ? columns.length + 1 : columns.length;

  const expandWidth = "2.5rem";
  const templateCols = expandable
    ? [expandWidth, ...columns.map(c => c.width)].join(" ")
    : columns.map(c => c.width).join(" ");

  return (
    <div className="grid text-sm" style={{ gridTemplateColumns: templateCols }}>
      {/* Header */}
      {expandable && <div className={HEADER} />}
      {columns.map(col => (
        <div key={col.id} className={`${HEADER} ${col.headerClass ?? ""}`}>
          {col.header}
        </div>
      ))}

      {/* Body */}
      {isLoading ? (
        <div className="col-span-full px-5 py-12">
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="shimmer h-10" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div
          className="col-span-full px-5 py-16 text-center text-sm text-[var(--color-text-tertiary)]"
          style={{ gridColumn: `1 / ${colCount + 1}` }}
        >
          {emptyMessage}
        </div>
      ) : (
        rows.map(row => (
          <LedgerRow
            key={rowKey(row)}
            row={row}
            columns={columns}
            expandable={expandable}
            renderExpanded={renderExpanded}
          />
        ))
      )}
    </div>
  );
}

function LedgerRow<T>({
  row,
  columns,
  expandable,
  renderExpanded,
}: {
  row: T;
  columns: ColumnDef<T>[];
  expandable: boolean;
  renderExpanded?: (row: T) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const borderClass = expanded
    ? "border-b border-[var(--color-surface-border)]"
    : "border-b border-[var(--color-surface-border-subtle)]/50";
  const bgClass = hovered ? "bg-[var(--color-surface-2)]/50" : "";
  const cellBase = `py-3 transition-colors ${borderClass} ${bgClass}`;
  const handlers = expandable
    ? {
        onClick: () => setExpanded(e => !e),
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      }
    : {};
  const cursorClass = expandable ? "cursor-pointer" : "";

  return (
    <>
      {expandable && (
        <div
          className={`${cellBase} ${cursorClass} px-3 text-center text-[var(--color-text-tertiary)]`}
          {...handlers}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      )}

      {columns.map(col => (
        <div
          key={col.id}
          className={`${cellBase} ${cursorClass} ${col.cellClass ?? ""}`}
          {...handlers}
        >
          {col.render(row)}
        </div>
      ))}

      {expanded && renderExpanded && (
        <div className="col-span-full border-b border-[var(--color-surface-border)]">
          {renderExpanded(row)}
        </div>
      )}
    </>
  );
}
