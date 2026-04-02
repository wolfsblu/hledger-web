import DateRangePicker from "./DateRangePicker";
import DarkModeToggle from "./DarkModeToggle";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 border-b border-gray-200 bg-white/80 px-6 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <DateRangePicker />
      <DarkModeToggle />
    </header>
  );
}
