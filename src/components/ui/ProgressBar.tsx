interface ProgressBarProps {
  current: number; // 0-based
  total: number;
  label?: string;
  /** Average seconds the user is expected to spend per remaining step.
   *  Defaults to 30 — calibrated against the typical question density. */
  secondsPerStep?: number;
  /** Display the section/step counter ("Section 2 of 6"). Skip welcome/
   *  thanks steps if `meaningfulTotal` and `meaningfulCurrent` are passed. */
  meaningfulCurrent?: number;
  meaningfulTotal?: number;
}

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return "Almost done";
  if (seconds < 60) return "Less than a minute left";
  const mins = Math.round(seconds / 60);
  return `~${mins} min left`;
}

export function ProgressBar({
  current,
  total,
  label,
  secondsPerStep = 30,
  meaningfulCurrent,
  meaningfulTotal,
}: ProgressBarProps) {
  const pct = Math.round(((current + 1) / total) * 100);
  const clamped = Math.min(100, Math.max(0, pct));

  // Remaining steps INCLUDING the current one (you're not done with it yet).
  const remainingSteps = Math.max(0, total - current - 1);
  const eta = formatRemaining(remainingSteps * secondsPerStep);

  const counter =
    meaningfulCurrent != null && meaningfulTotal != null
      ? `Section ${meaningfulCurrent} of ${meaningfulTotal}`
      : `Step ${current + 1} of ${total}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-900">
            {label ?? counter}
          </p>
          <p className="text-[11px] uppercase tracking-wider text-stone-500">
            {counter} · {eta}
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-stone-500">
          {clamped}%
        </span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current + 1}
        aria-label="Survey progress"
      >
        <div
          className="h-full rounded-full bg-forest-600 transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
