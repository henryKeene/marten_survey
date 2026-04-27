/**
 * Hand-written grouping of generated questions into wizard pages.
 *
 * The researcher edits docs/form.xlsx for content; this file controls
 * page boundaries and per-page intro copy. Adding a question to the
 * XLSForm without updating this file will leave the new question
 * unassigned to any page — the dev-mode check in development.ts flags that.
 */
import { questions, questionsById } from "./schema.generated";
import type { Question } from "./schema-types";

export type StepId =
  | "welcome"
  | "intro"
  | "acceptability"
  | "risk"
  | "tolerance"
  | "interactions"
  | "demographics"
  | "thanks";

export interface PairedItem {
  /** Shared description shown once at the top of the card. Optional. */
  sharedTitle?: string;
  /** Optional emoji icon rendered before the shared title. */
  icon?: string;
  pmId: string;
  foxId: string;
  pmLabel: string;
  foxLabel: string;
}

/** When set, the page renders both species' Likert items as one paired card
 *  per scenario instead of two separate slider-groups. The underlying answer
 *  ids stay the same — this is a UI-level grouping. */
export interface PairedConfig {
  prompt: string;
  hint?: string;
  leftLabel: string;
  rightLabel: string;
  anchors: string[];
  pairs: PairedItem[];
}

export interface BucketSortItemConfig {
  id: string;
  icon?: string;
  contextLabel: string;
  species: "pm" | "fox";
}

export interface BucketSortBucketConfig {
  value: number;
  label: string;
  /** Compact label for the sticky chip row (e.g. "Very low" instead of
   *  "Very low risk - No noticeable impact..."). */
  shortLabel: string;
  color: string;
  textColor: string;
}

export interface BucketSortConfig {
  prompt: string;
  hint?: string;
  buckets: BucketSortBucketConfig[];
  items: BucketSortItemConfig[];
}

export interface EmojiAnchor {
  value: number;
  emoji: string;
  label: string;
}

export interface EmojiReactionPairConfig {
  sharedTitle: string;
  icon?: string;
  pmId: string;
  foxId: string;
}

export interface EmojiReactionConfig {
  prompt: string;
  hint?: string;
  emojis: EmojiAnchor[];
  pairs: EmojiReactionPairConfig[];
}

export interface WizardPage {
  id: StepId;
  title: string;
  intro?: string;
  questions: Question[];
  /** Optional image to render at the top of the page (e.g. species photo). */
  imagesBefore?: { src: string; alt: string; caption?: string }[];
  /** When present, the page renders this paired view in place of the
   *  question list. Question metadata still drives validation/persistence. */
  paired?: PairedConfig;
  /** When present, the page renders a bucket-sort interaction. Mutually
   *  exclusive with `paired`. */
  bucketSort?: BucketSortConfig;
  /** When present, the page renders an emoji-reaction picker. Mutually
   *  exclusive with `paired` and `bucketSort`. */
  emojiReaction?: EmojiReactionConfig;
}

// Helpers
const q = (id: string): Question => {
  const found = questionsById[id];
  if (!found) throw new Error(`Question id "${id}" not found in schema.generated.ts`);
  return found;
};

const ACCEPTABILITY_ANCHORS = [
  "Completely unacceptable",
  "Unacceptable",
  "Somewhat unacceptable",
  "Neutral",
  "Somewhat acceptable",
  "Acceptable",
  "Completely acceptable",
];

const RISK_ANCHORS = [
  "Very low risk - No noticeable impact or very rare incidents",
  "Low risk - Occasional or minor issues",
  "Moderate risk - Some localised problems or occasional losses",
  "High risk - Frequent problems or clear evidence of damage/losses",
  "Very high risk - Severe, ongoing, or widespread problems",
];

const AGREEMENT_ANCHORS = [
  "Strongly disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly agree",
];

const acceptabilityPaired: PairedConfig = {
  prompt: "How acceptable do you think each scenario is for each species?",
  hint: "Tap a number for the pine marten, then for the fox.",
  leftLabel: "Completely unacceptable",
  rightLabel: "Completely acceptable",
  anchors: ACCEPTABILITY_ANCHORS,
  pairs: [
    {
      icon: "🌲",
      sharedTitle: "Seen in its natural habitat (e.g., woodland)",
      pmId: "pm_a",
      foxId: "fox_a",
      pmLabel: "Pine marten in woodland",
      foxLabel: "Fox in woodland",
    },
    {
      icon: "🏡",
      sharedTitle: "Seen around homes or farms (gardens, yards, farmyards)",
      pmId: "pm_b",
      foxId: "fox_b",
      pmLabel: "Pine marten around homes / farms",
      foxLabel: "Fox around homes / farms",
    },
    {
      icon: "🛏️",
      sharedTitle: "Has denned (lived or slept) in a house",
      pmId: "pm_c",
      foxId: "fox_c",
      pmLabel: "Pine marten denning in a house",
      foxLabel: "Fox denning in a house",
    },
    {
      icon: "🐔",
      sharedTitle: "Has attacked poultry or gamebirds",
      pmId: "pm_d",
      foxId: "fox_d",
      pmLabel: "Pine marten attacking poultry / gamebirds",
      foxLabel: "Fox attacking poultry / gamebirds",
    },
    {
      icon: "🗑️",
      sharedTitle: "Has been seen eating from a bin",
      pmId: "pm_e",
      foxId: "fox_e",
      pmLabel: "Pine marten eating from a bin",
      foxLabel: "Fox eating from a bin",
    },
  ],
};

const riskBucketSort: BucketSortConfig = {
  prompt: "Drop each card into the risk level you think it deserves.",
  hint: "Drag freely — you can move things between levels until you're happy. Or tap a card and pick a level.",
  buckets: [
    {
      value: 0,
      label: "Very low risk",
      shortLabel: "Very low",
      color: "bg-emerald-100",
      textColor: "text-emerald-900",
    },
    {
      value: 25,
      label: "Low risk",
      shortLabel: "Low",
      color: "bg-lime-100",
      textColor: "text-lime-900",
    },
    {
      value: 50,
      label: "Moderate risk",
      shortLabel: "Moderate",
      color: "bg-amber-100",
      textColor: "text-amber-900",
    },
    {
      value: 75,
      label: "High risk",
      shortLabel: "High",
      color: "bg-orange-200",
      textColor: "text-orange-900",
    },
    {
      value: 100,
      label: "Very high risk",
      shortLabel: "Very high",
      color: "bg-red-200",
      textColor: "text-red-900",
    },
  ],
  items: [
    { id: "pm_pet", icon: "🐾", contextLabel: "Pets", species: "pm" },
    { id: "fox_pet", icon: "🐾", contextLabel: "Pets", species: "fox" },
    { id: "pm_poultry", icon: "🐔", contextLabel: "Poultry / gamebirds", species: "pm" },
    { id: "fox_poultry", icon: "🐔", contextLabel: "Poultry / gamebirds", species: "fox" },
    { id: "pm_livestock", icon: "🐑", contextLabel: "Livestock", species: "pm" },
    { id: "fox_livestock", icon: "🐑", contextLabel: "Livestock", species: "fox" },
    { id: "pm_protected", icon: "🐿️", contextLabel: "Protected species", species: "pm" },
    { id: "fox_protected", icon: "🐿️", contextLabel: "Protected species", species: "fox" },
    { id: "pm_humans", icon: "🚶", contextLabel: "People", species: "pm" },
    { id: "fox_humans", icon: "🚶", contextLabel: "People", species: "fox" },
  ],
};

const tolerancePaired: PairedConfig = {
  prompt: "How much do you agree with these statements about each species?",
  hint: "Tap a number for the pine marten, then for the fox.",
  leftLabel: "Strongly disagree",
  rightLabel: "Strongly agree",
  anchors: AGREEMENT_ANCHORS,
  pairs: [
    {
      icon: "🌱",
      sharedTitle:
        "Provides ecological benefits that make their presence worthwhile (e.g., controlling pests like rodents, helping seed dispersal)",
      pmId: "pm_benefits",
      foxId: "fox_benefits",
      pmLabel: "Pine marten benefits",
      foxLabel: "Fox benefits",
    },
    {
      icon: "🤝",
      sharedTitle:
        "I am willing to tolerate some inconvenience to allow them in my local area (e.g., minor garden damage)",
      pmId: "pm_tolerate",
      foxId: "fox_tolerate",
      pmLabel: "Tolerate pine marten",
      foxLabel: "Tolerate fox",
    },
    {
      icon: "🛡️",
      sharedTitle:
        "I would take steps to make interactions less likely (e.g., securing bins, electric fencing for poultry)",
      pmId: "pm_prevent",
      foxId: "fox_prevent",
      pmLabel: "Prevent pine marten interactions",
      foxLabel: "Prevent fox interactions",
    },
    {
      icon: "🌿",
      sharedTitle:
        "Non-lethal methods should be used to manage them (e.g., deterrents, artificial den boxes)",
      pmId: "pm_nonlethal",
      foxId: "fox_nonlethal",
      pmLabel: "Non-lethal management for pine marten",
      foxLabel: "Non-lethal management for fox",
    },
    {
      icon: "⚖️",
      sharedTitle:
        "Lethal control should be permitted if they cause significant or persistent damage / losses",
      pmId: "pm_lethal",
      foxId: "fox_lethal",
      pmLabel: "Lethal control of pine marten",
      foxLabel: "Lethal control of fox",
    },
  ],
};

// Intro page: species identification + confidence + have-you-seen (matrix)
const introQuestions: Question[] = [
  q("species_f"),
  q("confidence_f"),
  q("species_pm"),
  q("confidence_pm"),
  q("seen_pm_matrix"),
];

// Acceptability page: hypothetical scenarios for pine marten and fox
const acceptabilityQuestions: Question[] = [q("pm_scenarios"), q("fox_scenarios")];

// Risk page
const riskQuestions: Question[] = [q("pm_risk"), q("fox_risk")];

// Tolerance / management page
const toleranceQuestions: Question[] = [q("pm_tolerance"), q("fox_tolerance")];

// Interactions page: gating matrix (sentiment sliders render inline
// underneath each matrix row via `followUps`) + season and loss-details
// follow-ups when losses were reported.
const interactionsQuestions: Question[] = [
  q("sp_local_matrix"),
  q("other_interactions"),
  q("season"),
  q("loss_details"),
  q("signs_losses"),
  q("other_sp_interactions"),
];

const demographicsQuestions: Question[] = [
  q("age"),
  q("gender"),
  q("postcode"),
  q("job"),
  q("hobbies"),
  q("comments"),
];

export const wizardPages: WizardPage[] = [
  {
    id: "welcome",
    title: "Welcome",
    intro:
      "A short survey about foxes and pine martens on the island of Ireland. Please read the information below before starting.",
    questions: [],
  },
  {
    id: "intro",
    title: "About the animals",
    intro:
      "First, a couple of quick questions to see how familiar you are with each species.",
    questions: introQuestions,
  },
  {
    id: "acceptability",
    title: "What feels acceptable?",
    intro:
      "Five quick scenarios — there are no right or wrong answers. Tap how acceptable each one feels for each species.",
    questions: acceptabilityQuestions,
    paired: acceptabilityPaired,
  },
  {
    id: "risk",
    title: "Perceived risk",
    intro:
      "Now five different contexts. Drag each card into the risk level you think it deserves.",
    questions: riskQuestions,
    bucketSort: riskBucketSort,
  },
  {
    id: "tolerance",
    title: "Living alongside them",
    intro:
      "Five short statements about coexisting with each species. Tap a number for each one.",
    questions: toleranceQuestions,
    paired: tolerancePaired,
  },
  {
    id: "interactions",
    title: "Your experiences",
    intro:
      "Tell us about any encounters you've had — none of this is required, share whatever you remember.",
    questions: interactionsQuestions,
  },
  {
    id: "demographics",
    title: "A little about you",
    intro:
      "Last few questions to help us understand how views vary across Ireland. Everything stays anonymous.",
    questions: demographicsQuestions,
  },
  {
    id: "thanks",
    title: "Thank you",
    questions: [],
  },
];

/** The canonical id lookup for any question belonging to any page. Includes
 *  the ids of any questions rendered inline via a choice-matrix's followUps. */
export const allPageQuestionIds: Set<string> = new Set(
  wizardPages.flatMap((p) =>
    p.questions.flatMap((question) => {
      if (question.kind === "slider-group") {
        return [question.id, ...question.items.map((i) => i.id)];
      }
      if (question.kind === "choice-matrix") {
        const ids = [question.id, ...question.items.map((i) => i.id)];
        if (question.followUps) {
          for (const perRow of Object.values(question.followUps)) {
            for (const qid of Object.values(perRow)) ids.push(qid);
          }
        }
        return ids;
      }
      return [question.id];
    }),
  ),
);

/** Development check: warn about any schema question not placed on a page. */
export function findUnassignedQuestionIds(): string[] {
  const out: string[] = [];
  for (const qu of questions) {
    if (qu.kind === "note") continue;
    if (qu.kind === "slider-group") {
      if (!allPageQuestionIds.has(qu.id)) out.push(qu.id);
      continue;
    }
    if (!allPageQuestionIds.has(qu.id)) out.push(qu.id);
  }
  return out;
}
