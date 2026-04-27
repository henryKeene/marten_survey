import type { ReactNode } from "react";
import { LabelText } from "./LabelText";

interface Choice {
  value: string;
  label: string;
}

export interface CardFlowMatrixProps {
  prompt: string;
  hint?: string;
  items: Array<{ id: string; label: string }>;
  choices: Choice[];
  multi?: boolean;
  exclusive?: string;
  values: Record<string, string | string[] | null>;
  onChange: (itemId: string, value: string | string[]) => void;
  required?: boolean;
  renderAfterRow?: (itemId: string) => ReactNode;
  /** Per-item emoji rendered as a friendly visual cue on each card. */
  itemIcons?: Record<string, string>;
  /** Per-choice colour dot — small visual hook for each species. */
  choiceDots?: Record<string, string>;
}

/**
 * Card-flow alternative to ChoiceMatrix. Each item gets its own card with
 * roomy spacing, a friendly icon, and large per-choice toggle buttons.
 *
 * Same data shape as ChoiceMatrix so the existing follow-up plumbing
 * (sentiment sliders) just works when this is used in place of the
 * dense matrix layout.
 */
export function CardFlowMatrix({
  prompt,
  hint,
  items,
  choices,
  multi = false,
  exclusive,
  values,
  onChange,
  required = false,
  renderAfterRow,
  itemIcons,
  choiceDots,
}: CardFlowMatrixProps) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="!font-sans !text-base font-semibold !text-stone-900 leading-snug">
          <LabelText text={prompt} />
          {required && (
            <span aria-hidden="true" className="ml-1 text-forest-700">
              *
            </span>
          )}
        </h3>
        {hint && <p className="mt-1 text-sm text-stone-600">{hint}</p>}
      </div>

      <ul className="space-y-3">
        {items.map((item) => {
          const raw = values[item.id] ?? null;
          const selected: string[] = multi
            ? Array.isArray(raw)
              ? raw
              : []
            : typeof raw === "string"
              ? [raw]
              : [];

          const toggle = (value: string) => {
            if (multi) {
              let next: string[];
              if (selected.includes(value)) {
                next = selected.filter((v) => v !== value);
              } else if (exclusive && value === exclusive) {
                next = [exclusive];
              } else if (exclusive) {
                next = [...selected.filter((v) => v !== exclusive), value];
              } else {
                next = [...selected, value];
              }
              onChange(item.id, next);
            } else {
              onChange(item.id, value);
            }
          };

          const followUp = renderAfterRow?.(item.id);

          return (
            <li
              key={item.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5"
            >
              <div className="flex items-start gap-3">
                {itemIcons?.[item.id] && (
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-50 text-lg"
                  >
                    {itemIcons[item.id]}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-900 leading-snug md:text-base">
                    <LabelText text={item.label} />
                  </p>
                </div>
              </div>

              <div
                className="mt-4 grid gap-2"
                role={multi ? "group" : "radiogroup"}
                aria-label={item.label}
                style={{
                  gridTemplateColumns: `repeat(${Math.min(choices.length, 3)}, minmax(0, 1fr))`,
                }}
              >
                {choices.map((choice) => {
                  const checked = selected.includes(choice.value);
                  const dot = choiceDots?.[choice.value];
                  return (
                    <label
                      key={choice.value}
                      className={[
                        "relative flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center text-sm font-semibold transition-all",
                        "active:scale-95",
                        checked
                          ? "border-forest-700 bg-forest-700 text-white shadow-md"
                          : "border-stone-300 bg-white text-stone-700 hover:border-forest-400 hover:bg-stone-50",
                      ].join(" ")}
                    >
                      <input
                        type={multi ? "checkbox" : "radio"}
                        name={`cardflow-${item.id}`}
                        value={choice.value}
                        checked={checked}
                        onChange={() => toggle(choice.value)}
                        className="sr-only"
                      />
                      {dot && !checked && (
                        <span
                          aria-hidden="true"
                          className={`inline-block h-2 w-2 shrink-0 rounded-full ${dot}`}
                        />
                      )}
                      {checked && <span aria-hidden="true">✓</span>}
                      <span>{choice.label}</span>
                    </label>
                  );
                })}
              </div>

              {followUp && hasContent(followUp) && (
                <div className="mt-4 rounded-xl border-l-2 border-forest-200 bg-stone-50 p-4">
                  {followUp}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function hasContent(node: ReactNode): boolean {
  if (Array.isArray(node)) return node.some((n) => n != null && n !== false);
  return node != null && node !== false;
}
