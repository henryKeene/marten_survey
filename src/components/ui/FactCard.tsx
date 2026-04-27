import { useMemo } from "react";

export interface Fact {
  label: string;
  body: string;
}

const NEUTRAL_FACTS: Fact[] = [
  {
    label: "Pine marten",
    body: "Pine martens are members of the mustelid family — relatives of badgers, otters, and stoats.",
  },
  {
    label: "Red fox",
    body: "Red foxes have vertical-slit pupils, like cats — useful for hunting in low light.",
  },
  {
    label: "Pine marten",
    body: "Pine martens are agile climbers and spend much of their time in tree canopies.",
  },
  {
    label: "Red fox",
    body: "A fox's typical home range across the island of Ireland is 1–10 km², depending on prey availability.",
  },
  {
    label: "Both species",
    body: "Both red foxes and pine martens are native species across the island of Ireland.",
  },
  {
    label: "Pine marten",
    body: "Adult pine martens weigh roughly 1–2 kg and are about the size of a small house cat.",
  },
];

export interface FactCardProps {
  /** Optional override; when omitted a fact is picked deterministically from
   *  the curated neutral pool using `seed` so the same user sees the same
   *  fact across re-renders within a session. */
  fact?: Fact;
  seed?: string;
  variant?: "default" | "celebratory";
}

/** Deliberately neutral wildlife trivia. Facts in this pool avoid valence
 *  language ("amazing", "harmful", "beneficial") so they don't bias any
 *  upcoming Likert rating. */
export function FactCard({ fact, seed = "default", variant = "default" }: FactCardProps) {
  const chosen = useMemo(() => {
    if (fact) return fact;
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
    const idx = Math.abs(h) % NEUTRAL_FACTS.length;
    return NEUTRAL_FACTS[idx];
  }, [fact, seed]);

  const isCelebratory = variant === "celebratory";

  return (
    <aside
      className={[
        "rounded-2xl border p-5",
        isCelebratory
          ? "border-forest-300 bg-forest-50"
          : "border-stone-200 bg-stone-50",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="text-2xl">
          🌿
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-700">
            {isCelebratory ? "One for the road" : "Did you know?"} · {chosen.label}
          </p>
          <p className="mt-1 text-sm text-stone-800 leading-snug">{chosen.body}</p>
        </div>
      </div>
    </aside>
  );
}
