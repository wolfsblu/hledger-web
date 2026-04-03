import { Menu } from "lucide-react";
import DateRangePicker from "./DateRangePicker";
import DarkModeToggle from "./DarkModeToggle";

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-0)]/90 px-8 backdrop-blur-xl">
      <button
        onClick={onMenuClick}
        className="lg:hidden -ml-2 rounded-lg p-2 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <DateRangePicker />
        <div className="h-5 w-px bg-[var(--color-surface-border)]" />
        <DarkModeToggle />
      </div>
    </header>
  );
}
