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
      className={`card-glow rounded-xl border border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-1)] p-6 ${className}`}
    >
      <h3 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
        {title}
      </h3>
      {children}
    </div>
  );
}
