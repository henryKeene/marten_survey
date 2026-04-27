import { LabelText } from "./LabelText";

interface Choice {
  value: string;
  label: string;
}

interface ChipCloudProps {
  name: string;
  choices: Choice[];
  value: string[];
  onChange: (value: string[]) => void;
  ariaLabelledby?: string;
}

/**
 * Tap-to-toggle chip cloud for multi-select questions. Replaces the stacked
 * CheckboxGroup with a wrapping flex of pill-shaped chips that's faster to
 * scan and faster to tap on a phone.
 */
export function ChipCloud({
  name,
  choices,
  value,
  onChange,
  ariaLabelledby,
}: ChipCloudProps) {
  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };

  return (
    <div role="group" aria-labelledby={ariaLabelledby} className="flex flex-wrap gap-2">
      {choices.map((choice) => {
        const checked = value.includes(choice.value);
        return (
          <label
            key={choice.value}
            className={[
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all",
              "active:scale-95",
              checked
                ? "border-forest-700 bg-forest-700 text-white shadow-md"
                : "border-stone-300 bg-white text-stone-700 hover:border-forest-400 hover:bg-stone-50",
            ].join(" ")}
          >
            <input
              type="checkbox"
              name={name}
              checked={checked}
              onChange={() => toggle(choice.value)}
              className="sr-only"
            />
            {checked && <span aria-hidden="true">✓</span>}
            <span>
              <LabelText text={choice.label} />
            </span>
          </label>
        );
      })}
    </div>
  );
}
