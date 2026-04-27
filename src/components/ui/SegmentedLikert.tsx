import { useId, useMemo } from "react";

export interface SegmentedLikertProps {
  value: number | null;
  onChange: (value: number) => void;
  leftLabel: string;
  rightLabel: string;
  anchors: string[];
  ariaLabel?: string;
}

/**
 * Pill-tap Likert input. Stores the same 0-100 value as RiskSlider so the
 * data shape is unchanged — taps map to evenly spaced anchor positions
 * (5 anchors → 0/25/50/75/100, 7 anchors → 0/17/33/50/67/83/100).
 *
 * One large round button per anchor, full width, thumb-zone friendly. The
 * full anchor text is shown as a readout under the row so the labels can
 * stay short on the buttons themselves.
 */
export function SegmentedLikert({
  value,
  onChange,
  leftLabel,
  rightLabel,
  anchors,
  ariaLabel,
}: SegmentedLikertProps) {
  const groupId = useId();
  const n = anchors.length;

  const anchorValues = useMemo(() => {
    if (n < 2) return [50];
    const step = 100 / (n - 1);
    return Array.from({ length: n }, (_, i) => Math.round(i * step));
  }, [n]);

  const selectedIndex = useMemo(() => {
    if (value === null) return -1;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(value - anchorValues[i]);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }, [value, anchorValues, n]);

  return (
    <div className="w-full select-none" role="radiogroup" aria-label={ariaLabel}>
      <div className="flex items-start justify-between gap-3 pb-2 text-[10px] font-medium uppercase tracking-wide text-stone-500 md:text-xs">
        <span className="max-w-[45%] leading-tight">{leftLabel}</span>
        <span className="max-w-[45%] text-right leading-tight">{rightLabel}</span>
      </div>

      <div className="flex items-center justify-between gap-1.5 md:gap-2" id={groupId}>
        {anchorValues.map((v, i) => {
          const isSelected = i === selectedIndex;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${i + 1} of ${n}: ${anchors[i]}`}
              onClick={() => onChange(v)}
              className={[
                "relative flex h-12 flex-1 items-center justify-center rounded-full border-2 text-sm font-semibold",
                "transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2",
                "md:h-14 md:text-base",
                isSelected
                  ? "border-forest-700 bg-forest-700 text-white shadow-md"
                  : "border-stone-300 bg-white text-stone-600 hover:border-forest-400 hover:bg-stone-50",
              ].join(" ")}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div
        className={`mt-2 min-h-[1.25rem] text-sm ${
          selectedIndex >= 0 ? "font-medium text-forest-800" : "text-stone-500"
        }`}
        aria-live="polite"
      >
        {selectedIndex >= 0 ? (
          <span className="font-semibold">{anchors[selectedIndex]}</span>
        ) : (
          "Tap an option."
        )}
      </div>
    </div>
  );
}
