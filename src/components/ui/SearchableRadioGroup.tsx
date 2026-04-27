import { useId, useMemo, useState } from "react";
import { LabelText } from "./LabelText";

interface Choice {
  value: string;
  label: string;
}

interface SearchableRadioGroupProps {
  name: string;
  choices: Choice[];
  value: string | null;
  onChange: (value: string) => void;
  ariaLabelledby?: string;
  searchPlaceholder?: string;
}

/**
 * Single-select with a live-filtering search input above. Built for the
 * 15-option industry list — typing 'edu' narrows to 'Education' instantly,
 * which beats hunting through a long horizontal radio row on a phone.
 *
 * The currently-selected option is always rendered even if it's filtered
 * out, so the user never loses sight of their answer.
 */
export function SearchableRadioGroup({
  name,
  choices,
  value,
  onChange,
  ariaLabelledby,
  searchPlaceholder = "Type to search…",
}: SearchableRadioGroupProps) {
  const groupId = useId();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return choices;
    const q = query.toLowerCase();
    return choices.filter(
      (c) => c.label.toLowerCase().includes(q) || c.value === value,
    );
  }, [choices, query, value]);

  return (
    <div role="radiogroup" aria-labelledby={ariaLabelledby} className="space-y-3">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 pr-9 text-sm focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-200"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
        >
          🔍
        </span>
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-600">
          No matches. Clear the search to see all options.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((choice) => {
            const checked = value === choice.value;
            return (
              <label
                key={choice.value}
                className={[
                  "cursor-pointer rounded-xl border-2 px-4 py-3 text-sm transition-colors",
                  checked
                    ? "border-forest-700 bg-forest-50 text-forest-900 font-semibold shadow-sm"
                    : "border-stone-300 bg-white text-stone-800 hover:border-forest-400 hover:bg-stone-50",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name={`${name}-${groupId}`}
                  value={choice.value}
                  checked={checked}
                  onChange={() => onChange(choice.value)}
                  className="sr-only"
                />
                <span>
                  <LabelText text={choice.label} />
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
