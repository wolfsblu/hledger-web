import type { ReactNode } from "react";

export default function StatCard({
  title,
  children,
  className = "",
  stretch = false,
  flush = false,
  headerAction,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  stretch?: boolean;
  flush?: boolean;
  headerAction?: ReactNode;
}) {
  return (
    <div
      className={`card-glow flex flex-col overflow-hidden rounded-xl border border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-1)] ${flush ? "pt-6" : "p-6"} ${className}`}
    >
      <div className={`mb-4 flex shrink-0 items-center justify-between ${flush ? "px-6" : ""}`}>
        <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
          {title}
        </h3>
        {headerAction}
      </div>
      <div className={stretch ? "flex flex-1 flex-col" : ""}>
        {children}
      </div>
    </div>
  );
}
