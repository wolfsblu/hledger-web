import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { useDateRange } from "../context/DateRangeContext";
import { getPresets } from "../lib/date-presets";

export default function DateRangePicker() {
  const { range, setRange } = useDateRange();
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(range.from);
  const [customTo, setCustomTo] = useState(range.to);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const presets = getPresets();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-surface-3)] hover:text-[var(--color-text-primary)]"
      >
        <Calendar size={14} strokeWidth={1.8} />
        <span className="font-body">{range.label}</span>
        <ChevronDown size={14} strokeWidth={1.8} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="animate-fade-up absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] p-3 shadow-2xl shadow-black/40">
          <div className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">
            Presets
          </div>
          <div className="flex flex-col gap-0.5">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setRange(preset);
                  setOpen(false);
                }}
                className={`rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                  range.label === preset.label
                    ? "bg-[var(--color-accent-glow)] text-[var(--color-accent)] shadow-[inset_0_0_0_1px_rgba(226,167,39,0.15)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-[var(--color-surface-border)] pt-3">
            <div className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">
              Custom Range
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-3)] px-2 py-1.5 font-mono text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-dim)] focus:outline-none"
              />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-3)] px-2 py-1.5 font-mono text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent-dim)] focus:outline-none"
              />
            </div>
            <button
              onClick={() => {
                setRange({ from: customFrom, to: customTo, label: `${customFrom} — ${customTo}` });
                setOpen(false);
              }}
              className="mt-2 w-full rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-[var(--color-surface-0)] transition-colors hover:bg-[var(--color-accent-dim)]"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
