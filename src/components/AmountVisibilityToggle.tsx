import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function getInitialHidden(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("hideAmounts") === "true";
}

export default function AmountVisibilityToggle() {
  const [hidden, setHidden] = useState(getInitialHidden);

  useEffect(() => {
    document.documentElement.classList.toggle("hide-amounts", hidden);
    localStorage.setItem("hideAmounts", String(hidden));
  }, [hidden]);

  return (
    <button
      onClick={() => setHidden((h) => !h)}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)]"
      aria-label={hidden ? "Show amounts" : "Hide amounts"}
    >
      <span className="flex items-center gap-2.5">
        {hidden ? (
          <EyeOff size={16} strokeWidth={1.8} className="text-[var(--color-text-tertiary)]" />
        ) : (
          <Eye size={16} strokeWidth={1.8} className="text-[var(--color-text-tertiary)]" />
        )}
        <span className="font-medium">Hide amounts</span>
      </span>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          hidden ? "bg-[var(--color-accent)]" : "bg-[var(--color-surface-3)]"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
            hidden ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </span>
    </button>
  );
}
