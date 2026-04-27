import { useState } from "react";
import { SegmentedLikert } from "./SegmentedLikert";
import { LabelText } from "./LabelText";

export interface PairedItem {
  /** Shared description shown once at the top of the card. Optional — when
   *  absent, only the per-species labels appear. */
  sharedTitle?: string;
  /** Optional emoji icon rendered before the shared title for visual rhythm. */
  icon?: string;
  pmId: string;
  foxId: string;
  pmLabel: string;
  foxLabel: string;
}

export interface PairedSegmentedLikertProps {
  prompt: string;
  hint?: string;
  leftLabel: string;
  rightLabel: string;
  anchors: string[];
  pairs: PairedItem[];
  values: Record<string, number | null>;
  onChange: (itemId: string, value: number) => void;
}

const PM_DOT = "bg-forest-600";
const FOX_DOT = "bg-amber";

export function PairedSegmentedLikert({
  prompt,
  hint,
  leftLabel,
  rightLabel,
  anchors,
  pairs,
  values,
  onChange,
}: PairedSegmentedLikertProps) {
  const [showAnchors, setShowAnchors] = useState(false);
  const hasAnchors = anchors.length > 2;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="!font-sans !text-base font-semibold !text-stone-900 leading-snug">
          <LabelText text={prompt} />
        </h3>
        {hint && (
          <p className="mt-1 text-sm text-stone-600">
            <LabelText text={hint} />
          </p>
        )}
        {hasAnchors && (
          <button
            type="button"
            onClick={() => setShowAnchors((s) => !s)}
            className="mt-2 text-xs text-forest-700 underline underline-offset-2 hover:text-forest-800"
          >
            {showAnchors ? "Hide the full scale" : "See all options on the scale"}
          </button>
        )}
        {showAnchors && hasAnchors && (
          <ul className="mt-2 space-y-1 rounded-lg bg-stone-100 p-3 text-xs text-stone-700">
            {anchors.map((a, i) => (
              <li key={a}>
                <span className="mr-2 inline-block w-4 text-center font-semibold text-forest-700">
                  {i + 1}
                </span>
                {a}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ul className="space-y-4">
        {pairs.map((pair) => (
          <li
            key={`${pair.pmId}__${pair.foxId}`}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5"
          >
            {pair.sharedTitle && (
              <div className="mb-4 flex items-start gap-3">
                {pair.icon && (
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-50 text-lg"
                  >
                    {pair.icon}
                  </span>
                )}
                <p className="flex-1 text-sm font-semibold text-stone-900 leading-snug md:text-base">
                  <LabelText text={pair.sharedTitle} />
                </p>
              </div>
            )}
            <SpeciesRow
              dotClass={PM_DOT}
              speciesName="Pine marten"
              detailLabel={pair.sharedTitle ? undefined : pair.pmLabel}
              value={values[pair.pmId] ?? null}
              onChange={(v) => onChange(pair.pmId, v)}
              leftLabel={leftLabel}
              rightLabel={rightLabel}
              anchors={anchors}
            />
            <div className="my-4 h-px bg-stone-100" />
            <SpeciesRow
              dotClass={FOX_DOT}
              speciesName="Fox"
              detailLabel={pair.sharedTitle ? undefined : pair.foxLabel}
              value={values[pair.foxId] ?? null}
              onChange={(v) => onChange(pair.foxId, v)}
              leftLabel={leftLabel}
              rightLabel={rightLabel}
              anchors={anchors}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpeciesRow({
  dotClass,
  speciesName,
  detailLabel,
  value,
  onChange,
  leftLabel,
  rightLabel,
  anchors,
}: {
  dotClass: string;
  speciesName: string;
  detailLabel?: string;
  value: number | null;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
  anchors: string[];
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <span
          aria-hidden="true"
          className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`}
        />
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-700">
          {speciesName}
        </span>
        {detailLabel && (
          <span className="text-sm text-stone-600 leading-snug">
            <LabelText text={detailLabel} />
          </span>
        )}
      </div>
      <SegmentedLikert
        value={value}
        onChange={onChange}
        leftLabel={leftLabel}
        rightLabel={rightLabel}
        anchors={anchors}
        ariaLabel={`${speciesName} — ${detailLabel ?? ""} — from ${leftLabel} to ${rightLabel}`}
      />
    </div>
  );
}
