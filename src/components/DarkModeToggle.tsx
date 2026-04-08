import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function DarkModeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)]"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="flex items-center gap-2.5">
        {theme === "dark" ? (
          <Moon size={16} strokeWidth={1.8} className="text-[var(--color-text-tertiary)]" />
        ) : (
          <Sun size={16} strokeWidth={1.8} className="text-[var(--color-text-tertiary)]" />
        )}
        <span className="font-medium">{theme === "dark" ? "Dark mode" : "Light mode"}</span>
      </span>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          theme === "dark" ? "bg-[var(--color-accent)]" : "bg-[var(--color-surface-3)]"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
            theme === "dark" ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </span>
    </button>
  );
}
