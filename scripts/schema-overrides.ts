/**
 * Hand-written patches layered on top of the raw XLSForm parse.
 *
 * The XLSForm is the researcher's preferred source of truth for question
 * content. Some things, though, cannot be expressed in XLSForm cleanly:
 *
 *   - Slider anchor lists for `range`-typed questions (XLSForm doesn't carry
 *     a Likert list, so the generator emits an empty `anchors: []`).
 *   - The multi-select-with-exclusive-option matrix shape used for
 *     `sp_local_matrix` (XLSForm models each row as a single select_one).
 *   - Minor prompt / label wording tweaks the researcher wants in the live
 *     form but hasn't yet propagated back into docs/form.xlsx.
 *   - Helper-based visibleIf predicates that are much cleaner than the raw
 *     "answers[x] === 'pm' || ..." translation of the XLSForm's `relevant`
 *     column.
 *
 * Rather than hand-editing src/survey/schema.generated.ts (which gets blown
 * away on every regenerate), each such change lives here. The generator
 * applies this file after parsing the XLSForm and before emission, so
 * running `npm run generate:schema` reproduces the current output.
 */

export interface QuestionPatch {
  prompt?: string;
  hint?: string;
  required?: boolean;
  leftLabel?: string;
  rightLabel?: string;
  anchors?: string[];
  choices?: Array<{ value: string; label: string }>;
  multi?: boolean;
  exclusive?: string;
  showPercent?: boolean;
  defaultValue?: number;
  followUps?: Record<string, Record<string, string>>;
  /** Replaces the translated `visibleIf` body. Must be a JS expression that
   *  references `answers` and any helpers defined in `helpersBlock` below. */
  visibleIfBody?: string;
}

/**
 * Full replacement for a parsed question. Use this when an override needs to
 * change the `kind` (e.g. converting a select_one into a slider). The
 * original question's visibleIf is preserved unless the replacement supplies
 * its own (via a separate entry in questionPatches).
 */
export type QuestionReplacement =
  | {
      kind: "single";
      id: string;
      prompt: string;
      hint?: string;
      required: boolean;
      choices: Array<{ value: string; label: string }>;
      layout: "horizontal" | "vertical";
    }
  | {
      kind: "multi";
      id: string;
      prompt: string;
      hint?: string;
      required: boolean;
      choices: Array<{ value: string; label: string }>;
    }
  | {
      kind: "slider";
      id: string;
      prompt: string;
      hint?: string;
      required: boolean;
      leftLabel: string;
      rightLabel: string;
      anchors: string[];
      showPercent?: boolean;
      defaultValue?: number;
    }
  | {
      kind: "text";
      id: string;
      prompt: string;
      hint?: string;
      required: boolean;
      multiline: boolean;
    };

const CONFIDENCE_ANCHORS = [
  "Not at all confident",
  "Slightly confident",
  "Moderately confident",
  "Confident",
  "Very confident",
];

const ACCEPTABILITY_ANCHORS = [
  "Completely unacceptable",
  "Unacceptable",
  "Somewhat unacceptable",
  "Neutral",
  "Somewhat acceptable",
  "Acceptable",
  "Completely acceptable",
];

const hasLossesPredicate =
  'hasSpecies(answers["sp_losses"], "pm") || hasSpecies(answers["sp_losses"], "fox")';

const expPredicate = (key: string, species: "pm" | "fox") =>
  `hasAnyInteraction(answers) && hasSpecies(answers["${key}"], "${species}")`;

const SENTIMENT_ANCHORS = [
  "Completely negative",
  "Somewhat negative",
  "Neutral",
  "Somewhat positive",
  "Completely positive",
];

/** Build a sentiment-slider replacement for one of the sp_*_exp_* questions.
 *  These were originally single-choice radios; we render them as sliders so
 *  the conditional follow-ups stay consistent with the other Likert-style
 *  questions in the survey. */
const sentimentSlider = (id: string, prompt: string): QuestionReplacement => ({
  kind: "slider",
  id,
  prompt,
  required: false,
  leftLabel: "Completely negative",
  rightLabel: "Completely positive",
  anchors: SENTIMENT_ANCHORS,
  showPercent: false,
  defaultValue: 50,
});

export const questionPatches: Record<string, QuestionPatch> = {
  // Species-ID prompts: generator pulls "Photo A / Photo B" verbatim from the
  // XLSForm; the live form shows the image directly above the question.
  species_f: {
    prompt: "What animal is this?",
  },
  species_pm: {
    prompt: "What animal is this?",
  },

  // Confidence sliders: XLSForm uses a `range` (1-10) with no Likert list, so
  // the generator emits anchors=[]. We want the 5-anchor scale the UI knows
  // how to render.
  confidence_f: {
    prompt: "How confident are you that you'd recognise this one in the wild?",
    anchors: CONFIDENCE_ANCHORS,
  },
  confidence_pm: {
    prompt: "How confident are you that you'd recognise this one in the wild?",
    anchors: CONFIDENCE_ANCHORS,
  },

  // Acceptability scenarios: add "Unacceptable" / "Acceptable" as inner
  // anchors so the 7-point scale is symmetric around "Neutral".
  pm_scenarios: { anchors: ACCEPTABILITY_ANCHORS },
  fox_scenarios: { anchors: ACCEPTABILITY_ANCHORS },

  // Risk sliders: the full anchor strings are long ("Very low risk - No
  // noticeable impact..."); short header labels read better above the track.
  // Anchor list itself stays with the descriptive text.
  pm_risk: { leftLabel: "Very low risk", rightLabel: "Very high risk" },
  fox_risk: { leftLabel: "Very low risk", rightLabel: "Very high risk" },

  // Experience matrix: convert to multi-select with "Neither" as the
  // mutually-exclusive option, and drop the redundant "Both" choice. The
  // sentiment-slider follow-ups are attached per row + species so they
  // appear inline directly under the row they relate to.
  sp_local_matrix: {
    prompt:
      "Tick any of these you've experienced with each species. Choose Neither if none apply.",
    multi: true,
    exclusive: "neither",
    choices: [
      { value: "fox", label: "Red fox" },
      { value: "pm", label: "European pine marten" },
      { value: "neither", label: "Neither" },
    ],
    followUps: {
      sp_local: { pm: "sp_local_exp_pm", fox: "sp_local_exp_fox" },
      sp_property: { pm: "sp_property_exp_pm", fox: "sp_property_exp_fox" },
      sp_denning: { pm: "sp_denning_exp_pm", fox: "sp_denning_exp_fox" },
      sp_bins: { pm: "sp_bins_exp_pm", fox: "sp_bins_exp_fox" },
      sp_damage: { pm: "sp_damage_exp_pm", fox: "sp_damage_exp_fox" },
      sp_losses: { pm: "sp_losses_exp_pm", fox: "sp_losses_exp_fox" },
    },
  },

  // Rewrite the long sp_*_exp_* gating predicates to use helpers. The raw
  // XLSForm `relevant` expression checks "== 'pm' || == 'fox' || == 'both'"
  // across every sp_* gate, which is verbose and doesn't work with the new
  // array-shaped values from the multi-select matrix.
  sp_local_exp_pm: { visibleIfBody: expPredicate("sp_local", "pm") },
  sp_property_exp_pm: { visibleIfBody: expPredicate("sp_property", "pm") },
  sp_denning_exp_pm: { visibleIfBody: expPredicate("sp_denning", "pm") },
  sp_bins_exp_pm: { visibleIfBody: expPredicate("sp_bins", "pm") },
  sp_damage_exp_pm: { visibleIfBody: expPredicate("sp_damage", "pm") },
  sp_losses_exp_pm: { visibleIfBody: expPredicate("sp_losses", "pm") },
  sp_local_exp_fox: { visibleIfBody: expPredicate("sp_local", "fox") },
  sp_property_exp_fox: { visibleIfBody: expPredicate("sp_property", "fox") },
  sp_denning_exp_fox: { visibleIfBody: expPredicate("sp_denning", "fox") },
  sp_bins_exp_fox: { visibleIfBody: expPredicate("sp_bins", "fox") },
  sp_damage_exp_fox: { visibleIfBody: expPredicate("sp_damage", "fox") },
  sp_losses_exp_fox: { visibleIfBody: expPredicate("sp_losses", "fox") },

  // Losses-gated follow-ups: same helper-based predicate.
  season: {
    prompt: "Which seasons did these happen in? (tick all that apply)",
    visibleIfBody: hasLossesPredicate,
  },
  loss_details: {
    prompt:
      "If you're comfortable, share what was lost — type of animals and roughly how many.",
    visibleIfBody: hasLossesPredicate,
  },
  signs_losses: {
    prompt: "Were there any signs that told you which animal caused the loss?",
    visibleIfBody: hasLossesPredicate,
  },

  // Demographics — gentler phrasing.
  postcode: {
    prompt: "Where do you live? (Eircode or postcode)",
    hint: "This helps us see how views vary across Ireland. Your response stays anonymous.",
  },
  job: { prompt: "What industry do you work in?" },
  hobbies: {
    prompt: "What are you into? (hobby, personal interest, or work — tick all that apply)",
  },
  comments: {
    prompt: "Anything else you'd like to share?",
  },

  // Free-text interaction prompts.
  other_interactions: {
    prompt: "Anything else? Other interactions you've had with foxes or pine martens.",
  },
  other_sp_interactions: {
    prompt:
      "Any encounters with other Irish wildlife you'd like to mention? (any species)",
  },
};

const PM_PROMPT = "Pine marten — how did you feel about this?";
const FOX_PROMPT = "Fox — how did you feel about this?";

export const questionReplacements: Record<string, QuestionReplacement> = {
  // Convert each of the 12 conditional sentiment questions from a 5-option
  // select_one (radios) into a sentiment slider. Prompts are concise because
  // the slider is rendered inline underneath the matching matrix row, which
  // already names the experience context ("Seen in my garden", etc.).
  sp_local_exp_pm: sentimentSlider("sp_local_exp_pm", PM_PROMPT),
  sp_property_exp_pm: sentimentSlider("sp_property_exp_pm", PM_PROMPT),
  sp_denning_exp_pm: sentimentSlider("sp_denning_exp_pm", PM_PROMPT),
  sp_bins_exp_pm: sentimentSlider("sp_bins_exp_pm", PM_PROMPT),
  sp_damage_exp_pm: sentimentSlider("sp_damage_exp_pm", PM_PROMPT),
  sp_losses_exp_pm: sentimentSlider("sp_losses_exp_pm", PM_PROMPT),
  sp_local_exp_fox: sentimentSlider("sp_local_exp_fox", FOX_PROMPT),
  sp_property_exp_fox: sentimentSlider("sp_property_exp_fox", FOX_PROMPT),
  sp_denning_exp_fox: sentimentSlider("sp_denning_exp_fox", FOX_PROMPT),
  sp_bins_exp_fox: sentimentSlider("sp_bins_exp_fox", FOX_PROMPT),
  sp_damage_exp_fox: sentimentSlider("sp_damage_exp_fox", FOX_PROMPT),
  sp_losses_exp_fox: sentimentSlider("sp_losses_exp_fox", FOX_PROMPT),
};

/**
 * Inserted verbatim near the top of schema.generated.ts. Provides the
 * `hasSpecies` / `hasAnyInteraction` helpers referenced by the overridden
 * visibleIf predicates above.
 */
export const helpersBlock = `/** Returns true if the sp_* answer (array from the new multi-select matrix,
 *  or legacy string like 'pm' / 'fox' / 'both') indicates the given species. */
function hasSpecies(v: unknown, species: "pm" | "fox"): boolean {
  if (Array.isArray(v)) return v.includes(species);
  if (typeof v === "string") return v === species || v === "both";
  return false;
}

const SP_KEYS = [
  "sp_local",
  "sp_property",
  "sp_denning",
  "sp_bins",
  "sp_damage",
  "sp_losses",
] as const;

function hasAnyInteraction(answers: Answers): boolean {
  return SP_KEYS.some(
    (k) => hasSpecies(answers[k], "pm") || hasSpecies(answers[k], "fox"),
  );
}
`;
