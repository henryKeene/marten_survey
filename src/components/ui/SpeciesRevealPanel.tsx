import { useState } from "react";

interface RevealConfig {
  questionId: string;
  /** Correct choice value for this photo. */
  correctValue: string;
  correctLabel: string;
  /** Filename under public/species/ for the small reveal photo. */
  photo: string;
  fact: string;
}

const REVEAL_BY_ID: Record<string, RevealConfig> = {
  species_f: {
    questionId: "species_f",
    correctValue: "fox",
    correctLabel: "Red fox",
    photo: "fox.jpg",
    fact: "Foxes can hear a mouse squeak from up to 100 metres away — and rotate their ears like little radar dishes.",
  },
  species_pm: {
    questionId: "species_pm",
    correctValue: "pine_marten",
    correctLabel: "European pine marten",
    photo: "pm.jpg",
    fact: "Pine martens have helped Ireland's native red squirrels rebound by keeping the invasive grey squirrel population in check.",
  },
};

const QUESTION_ORDER = ["species_f", "species_pm"] as const;

export interface SpeciesRevealPanelProps {
  answers: Record<string, unknown>;
}

/** Shown on the intro page after BOTH species ID questions have been
 *  committed. Never reveals partial answers — that would bias the second
 *  identification while the user is still answering it. */
export function SpeciesRevealPanel({ answers }: SpeciesRevealPanelProps) {
  const allAnswered = QUESTION_ORDER.every(
    (id) => typeof answers[id] === "string" && (answers[id] as string).length > 0,
  );
  const [expanded, setExpanded] = useState(false);

  if (!allAnswered) return null;

  return (
    <aside className="mt-8 rounded-2xl border border-forest-200 bg-forest-50 p-5">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div>
            <p className="text-sm font-semibold text-forest-900">
              ✨ Curious how you did?
            </p>
            <p className="mt-1 text-xs text-stone-700">
              Reveal the answers and a fun fact for each animal.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-forest-700 px-4 py-2 text-sm font-medium text-white">
            Reveal
          </span>
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-forest-900">
              ✨ Here's how you did
            </p>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-xs text-forest-700 underline underline-offset-2"
            >
              Hide
            </button>
          </div>
          <ul className="space-y-3">
            {QUESTION_ORDER.map((id, i) => {
              const cfg = REVEAL_BY_ID[id];
              const userAnswer = answers[id];
              const correct = userAnswer === cfg.correctValue;
              return (
                <RevealCard
                  key={id}
                  staggerDelay={i * 120}
                  correct={correct}
                  correctLabel={cfg.correctLabel}
                  photo={cfg.photo}
                  fact={cfg.fact}
                />
              );
            })}
          </ul>
        </div>
      )}
    </aside>
  );
}

function RevealCard({
  staggerDelay,
  correct,
  correctLabel,
  photo,
  fact,
}: {
  staggerDelay: number;
  correct: boolean;
  correctLabel: string;
  photo: string;
  fact: string;
}) {
  const base = import.meta.env.BASE_URL;
  return (
    <li
      className="flex gap-4 overflow-hidden rounded-xl border border-stone-200 bg-white p-3 shadow-sm animate-reveal-in"
      style={{ animationDelay: `${staggerDelay}ms` }}
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
        <img
          src={base + "species/" + photo}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2 text-sm font-semibold text-stone-900">
          <span aria-hidden="true">{correct ? "✅" : "✨"}</span>
          <span>
            {correct ? "Spot on — " : "It was a "}
            <span className="text-forest-800">{correctLabel}</span>
          </span>
        </p>
        <p className="mt-1 text-sm leading-snug text-stone-700">{fact}</p>
      </div>
      <style>{`
        @keyframes reveal-in {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-reveal-in {
          opacity: 0;
          animation: reveal-in 360ms ease-out forwards;
        }
      `}</style>
    </li>
  );
}
