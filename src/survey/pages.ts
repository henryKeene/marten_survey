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
      sharedTitle: "Seen in its natural habitat (e.g., woodland)",
      pmId: "pm_a",
      foxId: "fox_a",
      pmLabel: "Pine marten in woodland",
      foxLabel: "Fox in woodland",
    },
    {
      sharedTitle: "Seen around homes or farms (gardens, yards, farmyards)",
      pmId: "pm_b",
      foxId: "fox_b",
      pmLabel: "Pine marten around homes / farms",
      foxLabel: "Fox around homes / farms",
    },
    {
      sharedTitle: "Has denned (lived or slept) in a house",
      pmId: "pm_c",
      foxId: "fox_c",
      pmLabel: "Pine marten denning in a house",
      foxLabel: "Fox denning in a house",
    },
    {
      sharedTitle: "Has attacked poultry or gamebirds",
      pmId: "pm_d",
      foxId: "fox_d",
      pmLabel: "Pine marten attacking poultry / gamebirds",
      foxLabel: "Fox attacking poultry / gamebirds",
    },
    {
      sharedTitle: "Has been seen eating from a bin",
      pmId: "pm_e",
      foxId: "fox_e",
      pmLabel: "Pine marten eating from a bin",
      foxLabel: "Fox eating from a bin",
    },
  ],
};

const riskPaired: PairedConfig = {
  prompt: "How much risk do you believe each species poses in these contexts?",
  leftLabel: "Very low risk",
  rightLabel: "Very high risk",
  anchors: RISK_ANCHORS,
  pairs: [
    {
      sharedTitle: "Risk to pets (dogs, cats, rabbits)",
      pmId: "pm_pet",
      foxId: "fox_pet",
      pmLabel: "Pine marten risk to pets",
      foxLabel: "Fox risk to pets",
    },
    {
      sharedTitle: "Risk to poultry / gamebirds (chickens, pheasants)",
      pmId: "pm_poultry",
      foxId: "fox_poultry",
      pmLabel: "Pine marten risk to poultry",
      foxLabel: "Fox risk to poultry",
    },
    {
      sharedTitle: "Risk to other livestock (sheep, goats, pigs)",
      pmId: "pm_livestock",
      foxId: "fox_livestock",
      pmLabel: "Pine marten risk to livestock",
      foxLabel: "Fox risk to livestock",
    },
    {
      sharedTitle:
        "Risk to protected species (red squirrels, ground-nesting birds)",
      pmId: "pm_protected",
      foxId: "fox_protected",
      pmLabel: "Pine marten risk to protected species",
      foxLabel: "Fox risk to protected species",
    },
    {
      sharedTitle: "Risk of injury to people",
      pmId: "pm_humans",
      foxId: "fox_humans",
      pmLabel: "Pine marten risk to people",
      foxLabel: "Fox risk to people",
    },
  ],
};

const tolerancePaired: PairedConfig = {
  prompt: "How much do you agree with these statements about each species?",
  leftLabel: "Strongly disagree",
  rightLabel: "Strongly agree",
  anchors: AGREEMENT_ANCHORS,
  pairs: [
    {
      sharedTitle:
        "Provides ecological benefits that make their presence worthwhile (e.g., controlling pests like rodents, helping seed dispersal)",
      pmId: "pm_benefits",
      foxId: "fox_benefits",
      pmLabel: "Pine marten benefits",
      foxLabel: "Fox benefits",
    },
    {
      sharedTitle:
        "I am willing to tolerate some inconvenience to allow them in my local area (e.g., minor garden damage)",
      pmId: "pm_tolerate",
      foxId: "fox_tolerate",
      pmLabel: "Tolerate pine marten",
      foxLabel: "Tolerate fox",
    },
    {
      sharedTitle:
        "I would take steps to make interactions less likely (e.g., securing bins, electric fencing for poultry)",
      pmId: "pm_prevent",
      foxId: "fox_prevent",
      pmLabel: "Prevent pine marten interactions",
      foxLabel: "Prevent fox interactions",
    },
    {
      sharedTitle:
        "Non-lethal methods should be used to manage them (e.g., deterrents, artificial den boxes)",
      pmId: "pm_nonlethal",
      foxId: "fox_nonlethal",
      pmLabel: "Non-lethal management for pine marten",
      foxLabel: "Non-lethal management for fox",
    },
    {
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
      "We would like to start by asking a few questions about your familiarity with the animals we are studying.",
    questions: introQuestions,
  },
  {
    id: "acceptability",
    title: "Acceptability",
    intro: "",
    questions: acceptabilityQuestions,
    paired: acceptabilityPaired,
  },
  {
    id: "risk",
    title: "Perceived risk",
    intro: "",
    questions: riskQuestions,
    paired: riskPaired,
  },
  {
    id: "tolerance",
    title: "Tolerance and management",
    intro: "",
    questions: toleranceQuestions,
    paired: tolerancePaired,
  },
  {
    id: "interactions",
    title: "Your experiences",
    intro:
      "",
    questions: interactionsQuestions,
  },
  {
    id: "demographics",
    title: "A little about you",
    intro:
      "These final questions help us understand how views vary. All answers remain anonymous.",
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
