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
      className="rounded-lg p-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-secondary)]"
      aria-label={hidden ? "Show amounts" : "Hide amounts"}
    >
      {hidden ? (
        <Eye size={18} strokeWidth={1.8} />
      ) : (
        <EyeOff size={18} strokeWidth={1.8} />
      )}
    </button>
  );
}
