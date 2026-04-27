import { useState } from "react";
import { SegmentedLikert } from "./SegmentedLikert";
import { LabelText } from "./LabelText";

export interface SegmentedLikertGroupProps {
  prompt: string;
  leftLabel: string;
  rightLabel: string;
  anchors: string[];
  items: Array<{ id: string; label: string }>;
  values: Record<string, number | null>;
  onChange: (itemId: string, value: number) => void;
  required?: boolean;
}

/**
 * A set of related Likert questions sharing one scale. Renders as one card
 * per item with a pill-tap segmented input — replaces the 0-100 slider rows
 * for everything except the confidence questions.
 */
export function SegmentedLikertGroup({
  prompt,
  leftLabel,
  rightLabel,
  anchors,
  items,
  values,
  onChange,
  required = false,
}: SegmentedLikertGroupProps) {
  const [showAnchors, setShowAnchors] = useState(false);
  const hasAnchors = anchors.length > 2;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="!font-sans !text-base font-semibold !text-stone-900 leading-snug">
          <LabelText text={prompt} />
          {required && (
            <span aria-hidden="true" className="ml-1 text-forest-700">
              *
            </span>
          )}
        </h3>
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

      <ul className="divide-y divide-stone-200 md:overflow-hidden md:rounded-xl md:border md:border-stone-200 md:bg-white">
        {items.map((item) => (
          <li key={item.id} className="py-5 md:p-5">
            <div className="mb-3 text-sm font-semibold text-stone-900 leading-snug">
              <LabelText text={item.label} />
            </div>
            <SegmentedLikert
              ariaLabel={`${item.label} — from ${leftLabel} to ${rightLabel}`}
              value={values[item.id] ?? null}
              onChange={(v) => onChange(item.id, v)}
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
