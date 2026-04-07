import { NavLink } from "react-router";
import { LayoutDashboard, Wallet, ArrowLeftRight, BookOpen, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const links: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r bg-[var(--color-surface-1)] border-[var(--color-surface-border-subtle)] transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-[var(--color-surface-0)]">
          <BookOpen size={16} strokeWidth={2.5} />
        </div>
        <div className="flex flex-1 flex-col">
          <span className="font-display text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
            hledger
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden -mr-1 rounded-lg p-1.5 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-[var(--color-surface-border-subtle)]" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 pt-4">
        <div className="mb-3 px-3 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">
          Navigation
        </div>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[var(--color-accent-glow)] text-[var(--color-accent)] shadow-[inset_0_0_0_1px_rgba(226,167,39,0.15)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  strokeWidth={1.8}
                  className={`transition-colors ${isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)]"}`}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--color-surface-border-subtle)] px-5 py-4">
        <div className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
          <a href="https://plaintextaccounting.org/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-text-secondary)] transition-colors">Plaintext Accounting</a>
        </div>
      </div>
    </aside>
  );
}
