import DateRangePicker from "./DateRangePicker";
import DarkModeToggle from "./DarkModeToggle";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-surface-border-subtle)] bg-[var(--color-surface-0)]/90 px-8 backdrop-blur-xl">
      <div />
      <div className="flex items-center gap-3">
        <DateRangePicker />
        <div className="h-5 w-px bg-[var(--color-surface-border)]" />
        <DarkModeToggle />
      </div>
    </header>
  );
}
