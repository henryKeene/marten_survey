import { useState } from "react";

export interface PhotoGridChoice {
  value: string;
  label: string;
  thumbnail?: string;
}

export interface PhotoGridIdentifyProps {
  choices: PhotoGridChoice[];
  /** The "not sure / I don't know" value, separated out below the grid. */
  notSureValue?: string;
  value: string | null;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

/**
 * 2-column photo grid for species identification. Tap a thumbnail to commit
 * an answer. "Not sure" is rendered as a full-width button under the grid
 * since it's a meta-answer rather than another candidate.
 */
export function PhotoGridIdentify({
  choices,
  notSureValue = "not_sure",
  value,
  onChange,
  ariaLabel,
}: PhotoGridIdentifyProps) {
  const grid = choices.filter((c) => c.value !== notSureValue);
  const notSure = choices.find((c) => c.value === notSureValue);

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="space-y-3">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {grid.map((choice) => (
          <li key={choice.value}>
            <PhotoTile
              choice={choice}
              selected={value === choice.value}
              onSelect={() => onChange(choice.value)}
            />
          </li>
        ))}
      </ul>
      {notSure && (
        <button
          type="button"
          role="radio"
          aria-checked={value === notSure.value}
          onClick={() => onChange(notSure.value)}
          className={[
            "w-full rounded-2xl border-2 px-4 py-3 text-sm font-medium transition",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2",
            value === notSure.value
              ? "border-forest-700 bg-forest-700 text-white shadow-md"
              : "border-stone-300 bg-white text-stone-700 hover:border-forest-400 hover:bg-stone-50",
          ].join(" ")}
        >
          {notSure.label}
        </button>
      )}
    </div>
  );
}

function PhotoTile({
  choice,
  selected,
  onSelect,
}: {
  choice: PhotoGridChoice;
  selected: boolean;
  onSelect: () => void;
}) {
  const [errored, setErrored] = useState(false);
  const base = import.meta.env.BASE_URL;
  const src = choice.thumbnail ? `${base}species/${choice.thumbnail}` : null;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={choice.label}
      onClick={onSelect}
      className={[
        "group relative flex w-full flex-col overflow-hidden rounded-2xl border-2 bg-white text-left transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2",
        selected
          ? "border-forest-700 ring-4 ring-forest-200 shadow-md"
          : "border-stone-200 hover:border-forest-400 hover:shadow-sm",
      ].join(" ")}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {src && !errored ? (
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
            onError={() => setErrored(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-xs text-stone-500">
            <span>Photo placeholder</span>
          </div>
        )}
        {selected && (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-forest-700 text-white shadow"
          >
            ✓
          </span>
        )}
      </div>
      <div
        className={`px-3 py-2 text-center text-sm font-semibold ${
          selected ? "text-forest-800" : "text-stone-800"
        }`}
      >
        {choice.label}
      </div>
    </button>
  );
}
