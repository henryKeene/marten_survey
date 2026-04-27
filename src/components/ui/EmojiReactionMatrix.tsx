import { LabelText } from "./LabelText";

export interface EmojiAnchor {
  value: number;
  emoji: string;
  label: string;
}

export interface EmojiReactionPair {
  sharedTitle: string;
  icon?: string;
  pmId: string;
  foxId: string;
}

export interface EmojiReactionMatrixProps {
  prompt: string;
  hint?: string;
  emojis: EmojiAnchor[];
  pairs: EmojiReactionPair[];
  values: Record<string, number | null>;
  onChange: (itemId: string, value: number) => void;
}

const SPECIES = {
  pm: { dot: "bg-forest-600", name: "Pine marten" },
  fox: { dot: "bg-amber", name: "Fox" },
} as const;

/**
 * Likert-style picker that swaps numbered pills for large emoji reactions.
 * Same 0–100 underlying values; same five-anchor scale; very different feel.
 *
 * Used on the tolerance page to break up the Likert tunnel — emojis make
 * the agreement scale feel more emotive than abstract.
 */
export function EmojiReactionMatrix({
  prompt,
  hint,
  emojis,
  pairs,
  values,
  onChange,
}: EmojiReactionMatrixProps) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="!font-sans !text-base font-semibold !text-stone-900 leading-snug">
          <LabelText text={prompt} />
        </h3>
        {hint && <p className="mt-1 text-sm text-stone-600">{hint}</p>}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-3 text-xs text-stone-600 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          {emojis.map((e) => (
            <div key={e.value} className="flex flex-col items-center gap-1 text-center">
              <span className="text-2xl leading-none" aria-hidden="true">
                {e.emoji}
              </span>
              <span className="text-[10px] uppercase tracking-wide leading-tight">
                {e.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ul className="space-y-3">
        {pairs.map((pair) => (
          <li
            key={`${pair.pmId}__${pair.foxId}`}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5"
          >
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

            <SpeciesEmojiRow
              species="pm"
              emojis={emojis}
              value={values[pair.pmId] ?? null}
              onChange={(v) => onChange(pair.pmId, v)}
              ariaPrefix={pair.sharedTitle}
            />
            <div className="my-3 h-px bg-stone-100" />
            <SpeciesEmojiRow
              species="fox"
              emojis={emojis}
              value={values[pair.foxId] ?? null}
              onChange={(v) => onChange(pair.foxId, v)}
              ariaPrefix={pair.sharedTitle}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SpeciesEmojiRow({
  species,
  emojis,
  value,
  onChange,
  ariaPrefix,
}: {
  species: "pm" | "fox";
  emojis: EmojiAnchor[];
  value: number | null;
  onChange: (v: number) => void;
  ariaPrefix: string;
}) {
  const sp = SPECIES[species];
  const selected = value !== null
    ? emojis.reduce(
        (best, e) => (Math.abs(e.value - value) < Math.abs(best.value - value) ? e : best),
        emojis[0],
      )
    : null;

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <span
          aria-hidden="true"
          className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${sp.dot}`}
        />
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-700">
          {sp.name}
        </span>
        {selected && (
          <span className="text-xs font-medium text-forest-800">
            · {selected.label}
          </span>
        )}
      </div>
      <div role="radiogroup" aria-label={`${sp.name} — ${ariaPrefix}`} className="flex items-center justify-between gap-1.5">
        {emojis.map((e) => {
          const isSelected = selected?.value === e.value;
          return (
            <button
              key={e.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={e.label}
              onClick={() => onChange(e.value)}
              className={[
                "relative flex h-14 flex-1 items-center justify-center rounded-2xl border-2 text-2xl transition-all",
                "active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2",
                isSelected
                  ? "border-forest-700 bg-forest-50 shadow-md scale-[1.05]"
                  : "border-stone-200 bg-white hover:border-forest-300 hover:bg-stone-50",
              ].join(" ")}
            >
              <span aria-hidden="true">{e.emoji}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
