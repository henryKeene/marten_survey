import { useMemo, useState } from "react";
import type { AnswerValue, Question } from "./schema-types";
import { questionsById } from "./schema.generated";
import { FieldLabel, HelperText } from "../components/ui/FieldLabel";
import { LabelText } from "../components/ui/LabelText";
import { RadioGroup } from "../components/ui/RadioGroup";
import { CheckboxGroup } from "../components/ui/CheckboxGroup";
import { ChipCloud } from "../components/ui/ChipCloud";
import { SearchableRadioGroup } from "../components/ui/SearchableRadioGroup";
import { TextInput } from "../components/ui/TextInput";
import { TextArea } from "../components/ui/TextArea";
import { RiskSlider } from "../components/ui/RiskSlider";
import { SegmentedLikert } from "../components/ui/SegmentedLikert";
import { SegmentedLikertGroup } from "../components/ui/SegmentedLikertGroup";
import { ChoiceMatrix } from "../components/ui/ChoiceMatrix";
import { CardFlowMatrix } from "../components/ui/CardFlowMatrix";
import { PhotoGridIdentify } from "../components/ui/PhotoGridIdentify";
import { DragNameIdentify } from "../components/ui/DragNameIdentify";
import { useIdVariant } from "../util/use-id-variant";

/** Friendly icons for the card-flow interactions matrix. Keyed by item id. */
const SP_LOCAL_MATRIX_ICONS: Record<string, string> = {
  sp_local: "🌲",
  sp_property: "🏡",
  sp_denning: "🛏️",
  sp_bins: "🗑️",
  sp_damage: "🔨",
  sp_losses: "🐓",
};

const SP_LOCAL_MATRIX_DOTS: Record<string, string> = {
  fox: "bg-amber",
  pm: "bg-forest-600",
  neither: "bg-stone-400",
};

/** Filename under public/species/ for each species ID choice value. Falls
 *  back to a labelled placeholder when the file is missing. */
const SPECIES_THUMBNAILS: Record<string, string> = {
  pine_marten: "pm.jpg",
  fox: "fox.jpg",
  stoat: "stoat.jpg",
  ferret: "ferret.jpg",
  domestic_cat: "domestic_cat.jpg",
  badger: "badger.jpg",
};

/** Big mystery photo per species-ID question. Only set for "guess" mode
 *  questions where the photo IS the question. */
const SPECIES_QUESTION_IMAGE: Record<string, string> = {
  species_f: "species/fox.jpg",
};

/**
 * "guess": user is shown a mystery image and picks the species name.
 * "find":  user is given a species name and picks the matching photo.
 *
 * Splitting the two ID questions across modes breaks the monotony of asking
 * the same question shape twice in a row.
 */
const SPECIES_QUESTION_MODE: Record<string, "guess" | "find"> = {
  species_f: "guess",
  species_pm: "find",
};

const PHOTO_GRID_QUESTION_IDS = new Set(["species_f", "species_pm"]);
import { validateIrishOrNIPostcode, postcodeErrorMessage } from "./validators/postcode";

const FREE_TEXT_NOTICE =
  "Please do not include identifying information (names, phone numbers, addresses) in your answer.";

interface Props {
  question: Question;
  answers: Record<string, AnswerValue>;
  onAnswer: (id: string, value: AnswerValue) => void;
}

export function QuestionRenderer({ question: q, answers, onAnswer }: Props) {
  const labelId = `q-${q.id}-label`;
  const value = answers[q.id];

  switch (q.kind) {
    case "note":
      return (
        <section aria-labelledby={labelId} className="rounded-xl bg-stone-100 p-4 text-sm text-stone-700">
          <p id={labelId}>
            <LabelText text={q.prompt} />
          </p>
        </section>
      );

    case "single": {
      const isIdQuestion = PHOTO_GRID_QUESTION_IDS.has(q.id);
      if (isIdQuestion) {
        return (
          <SpeciesIdQuestion
            questionId={q.id}
            prompt={q.prompt}
            hint={q.hint}
            required={q.required}
            choices={q.choices}
            value={typeof value === "string" ? value : null}
            onChange={(v) => onAnswer(q.id, v)}
            labelId={labelId}
          />
        );
      }
      // Long single-select lists (e.g. industry) get a search-as-you-type
      // affordance so the user isn't hunting through 15 horizontal radios.
      const useSearchable = q.id === "job" || q.choices.length >= 12;
      return (
        <section aria-labelledby={labelId} className="space-y-3">
          <FieldLabel id={labelId} required={q.required}>
            <LabelText text={q.prompt} />
          </FieldLabel>
          {q.hint && <HelperText>{q.hint}</HelperText>}
          {useSearchable ? (
            <SearchableRadioGroup
              name={q.id}
              choices={q.choices}
              value={typeof value === "string" ? value : null}
              onChange={(v) => onAnswer(q.id, v)}
              ariaLabelledby={labelId}
            />
          ) : (
            <RadioGroup
              name={q.id}
              choices={q.choices}
              value={typeof value === "string" ? value : null}
              onChange={(v) => onAnswer(q.id, v)}
              layout={q.layout}
              ariaLabelledby={labelId}
            />
          )}
        </section>
      );
    }

    case "multi": {
      // Hobbies-style multi-selects with shorter labels work better as a
      // wrapping chip cloud than as stacked checkboxes — faster to scan and
      // tap on a phone. Long-label multi-selects (e.g. seasons) keep the
      // existing CheckboxGroup so the labels don't truncate.
      const useChips = q.id === "hobbies";
      return (
        <section aria-labelledby={labelId} className="space-y-3">
          <FieldLabel id={labelId} required={q.required}>
            <LabelText text={q.prompt} />
          </FieldLabel>
          {q.hint && <HelperText>{q.hint}</HelperText>}
          {useChips ? (
            <ChipCloud
              name={q.id}
              choices={q.choices}
              value={Array.isArray(value) ? (value as string[]) : []}
              onChange={(v) => onAnswer(q.id, v)}
              ariaLabelledby={labelId}
            />
          ) : (
            <CheckboxGroup
              name={q.id}
              choices={q.choices}
              value={Array.isArray(value) ? (value as string[]) : []}
              onChange={(v) => onAnswer(q.id, v)}
              ariaLabelledby={labelId}
            />
          )}
        </section>
      );
    }

    case "slider": {
      // showPercent is true by default; the only sliders that opt out are the
      // anchor-based ones (sentiment sliders). Those become pill-tap Likerts;
      // the percent sliders (confidence_f / confidence_pm) keep the 0-100 thumb.
      const isAnchorScale = q.showPercent === false && q.anchors.length >= 2;
      return (
        <section aria-labelledby={labelId} className="space-y-3">
          <FieldLabel id={labelId} required={q.required}>
            <LabelText text={q.prompt} />
          </FieldLabel>
          {q.hint && <HelperText>{q.hint}</HelperText>}
          {isAnchorScale ? (
            <SegmentedLikert
              value={typeof value === "number" ? value : null}
              onChange={(v) => onAnswer(q.id, v)}
              leftLabel={q.leftLabel}
              rightLabel={q.rightLabel}
              anchors={q.anchors}
              ariaLabel={`${q.prompt} — scale from ${q.leftLabel} to ${q.rightLabel}`}
            />
          ) : (
            <RiskSlider
              value={typeof value === "number" ? value : null}
              onChange={(v) => onAnswer(q.id, v)}
              leftLabel={q.leftLabel}
              rightLabel={q.rightLabel}
              anchors={q.anchors}
              ariaLabel={`${q.prompt} — scale from ${q.leftLabel} to ${q.rightLabel}`}
              showHeaderLabels
              showPercent={q.showPercent}
              defaultValue={q.defaultValue}
            />
          )}
        </section>
      );
    }

    case "slider-group": {
      // Slider-group item answers live as top-level keys in the answers map
      // so that visibleIf predicates referencing `${pm_pet}` etc. resolve.
      const values: Record<string, number | null> = {};
      for (const item of q.items) {
        const v = answers[item.id];
        values[item.id] = typeof v === "number" ? v : null;
      }
      return (
        <section aria-labelledby={labelId} className="space-y-4">
          <span id={labelId} className="sr-only">
            {q.prompt}
          </span>
          <SegmentedLikertGroup
            prompt={q.prompt}
            leftLabel={q.leftLabel}
            rightLabel={q.rightLabel}
            anchors={q.anchors}
            items={q.items}
            values={values}
            onChange={(itemId, v) => onAnswer(itemId, v)}
            required={q.required}
          />
        </section>
      );
    }

    case "choice-matrix": {
      // Choice-matrix item answers also live as flat top-level keys.
      const values: Record<string, string | string[] | null> = {};
      for (const item of q.items) {
        const v = answers[item.id];
        if (q.multi) {
          values[item.id] = Array.isArray(v) ? (v as string[]) : null;
        } else {
          values[item.id] = typeof v === "string" ? v : null;
        }
      }
      const renderAfterRow = q.followUps
        ? (itemId: string) => {
            const selected = values[itemId];
            if (!Array.isArray(selected) || selected.length === 0) return null;
            const map = q.followUps![itemId] ?? {};
            return selected.flatMap((choiceValue) => {
              const followId = map[choiceValue];
              if (!followId) return [];
              const followQ = questionsById[followId];
              if (!followQ) return [];
              return [
                <QuestionRenderer
                  key={followId}
                  question={followQ}
                  answers={answers}
                  onAnswer={onAnswer}
                />,
              ];
            });
          }
        : undefined;
      // Multi-select matrices get the roomier card-flow layout. Single-select
      // matrices (e.g. seen_pm_matrix) stay on the compact ChoiceMatrix since
      // they already read fine on mobile.
      const useCardFlow = q.multi === true;
      return (
        <section aria-labelledby={labelId} className="space-y-4">
          <span id={labelId} className="sr-only">
            {q.prompt}
          </span>
          {useCardFlow ? (
            <CardFlowMatrix
              prompt={q.prompt}
              hint={q.hint}
              items={q.items}
              choices={q.choices}
              multi={q.multi}
              exclusive={q.exclusive}
              values={values}
              onChange={(itemId, v) => onAnswer(itemId, v)}
              required={q.required}
              renderAfterRow={renderAfterRow}
              itemIcons={q.id === "sp_local_matrix" ? SP_LOCAL_MATRIX_ICONS : undefined}
              choiceDots={q.id === "sp_local_matrix" ? SP_LOCAL_MATRIX_DOTS : undefined}
            />
          ) : (
            <ChoiceMatrix
              prompt={q.prompt}
              hint={q.hint}
              items={q.items}
              choices={q.choices}
              multi={q.multi}
              exclusive={q.exclusive}
              values={values}
              onChange={(itemId, v) => onAnswer(itemId, v)}
              required={q.required}
              renderAfterRow={renderAfterRow}
            />
          )}
        </section>
      );
    }

    case "text": {
      if (q.validate === "postcode-ie-ni") {
        return <PostcodeField question={q} value={value} onChange={(v) => onAnswer(q.id, v)} labelId={labelId} />;
      }
      const textValue = typeof value === "string" ? value : "";
      return (
        <section aria-labelledby={labelId} className="space-y-3">
          <FieldLabel id={labelId} required={q.required}>
            <LabelText text={q.prompt} />
          </FieldLabel>
          {q.hint && <HelperText>{q.hint}</HelperText>}
          {q.multiline ? (
            <TextArea
              id={q.id}
              value={textValue}
              onChange={(e) => onAnswer(q.id, e.target.value)}
              aria-labelledby={labelId}
              rows={3}
            />
          ) : (
            <TextInput
              id={q.id}
              value={textValue}
              onChange={(e) => onAnswer(q.id, e.target.value)}
              aria-labelledby={labelId}
            />
          )}

        </section>
      );
    }
  }
}

function SpeciesIdQuestion({
  questionId,
  prompt,
  hint,
  required,
  choices,
  value,
  onChange,
  labelId,
}: {
  questionId: string;
  prompt: string;
  hint?: string;
  required: boolean;
  choices: { value: string; label: string }[];
  value: string | null;
  onChange: (v: string) => void;
  labelId: string;
}) {
  const [variant, setVariant] = useIdVariant();
  const base = import.meta.env.BASE_URL;
  const mode = SPECIES_QUESTION_MODE[questionId] ?? "guess";
  const imagePath = SPECIES_QUESTION_IMAGE[questionId];
  const imageSrc = imagePath ? base + imagePath : null;

  // The variant toggle only makes sense for "guess" mode (mystery image
  // present, user picks the name). Find mode always uses the grid.
  const showToggle = mode === "guess" && questionId === "species_f";
  const isFind = mode === "find";

  // In find mode, the prompt names the species, so we render the grid as the
  // primary input. In guess mode, the mystery image goes above the input.
  return (
    <section aria-labelledby={labelId} className="space-y-4">
      <FieldLabel id={labelId} required={required}>
        <LabelText text={prompt} />
      </FieldLabel>
      {hint && <HelperText>{hint}</HelperText>}

      {isFind ? (
        <PhotoGridIdentify
          choices={choices.map((c) => ({
            ...c,
            thumbnail: SPECIES_THUMBNAILS[c.value],
          }))}
          value={value}
          onChange={onChange}
          ariaLabel={prompt}
        />
      ) : variant === "grid" ? (
        <>
          {imageSrc && (
            <figure className="mb-4">
              <div className="relative mx-auto aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-stone-200 bg-stone-100 shadow-lg">
                <img
                  src={imageSrc}
                  alt=""
                  className="h-full w-full animate-mystery-in object-cover"
                  loading="lazy"
                />
                <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-forest-800 shadow">
                  🔍 Mystery animal
                </span>
                <style>{`
                  @keyframes mystery-in {
                    0% { transform: scale(1.06); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                  .animate-mystery-in {
                    animation: mystery-in 480ms ease-out both;
                  }
                `}</style>
              </div>
            </figure>
          )}
          <PhotoGridIdentify
            choices={choices.map((c) => ({
              ...c,
              thumbnail: SPECIES_THUMBNAILS[c.value],
            }))}
            value={value}
            onChange={onChange}
            ariaLabel={prompt}
          />
        </>
      ) : (
        <DragNameIdentify
          imageSrc={imageSrc}
          imageAlt=""
          choices={choices}
          value={value}
          onChange={onChange}
          ariaLabel={prompt}
        />
      )}

      {showToggle && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setVariant(variant === "grid" ? "drag" : "grid")}
            className="text-xs font-medium text-forest-700 underline underline-offset-2 hover:text-forest-800"
          >
            🔄 Try the {variant === "grid" ? "drag-and-drop" : "photo-grid"} version
          </button>
        </div>
      )}
    </section>
  );
}

function PostcodeField({
  question: q,
  value,
  onChange,
  labelId,
}: {
  question: Extract<Question, { kind: "text" }>;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  labelId: string;
}) {
  const [touched, setTouched] = useState(false);
  const raw = typeof value === "string" ? value : "";
  const result = useMemo(() => (raw ? validateIrishOrNIPostcode(raw) : null), [raw]);
  const errorMessage =
    touched && result && !result.ok ? postcodeErrorMessage(result.reason) : null;

  return (
    <section aria-labelledby={labelId} className="space-y-3">
      <FieldLabel id={labelId} required={q.required}>
        {q.prompt}
      </FieldLabel>
      {q.hint && <HelperText>{q.hint}</HelperText>}
      <TextInput
        id={q.id}
        value={raw}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        aria-labelledby={labelId}
        error={errorMessage}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        placeholder="e.g. BT12 5AB or D02 X285"
      />
      {errorMessage && <HelperText tone="error">{errorMessage}</HelperText>}
      {result && result.ok && (
        <HelperText>
          {result.kind === "ni"
            ? "Northern Ireland postcode"
            : result.kind === "ni-partial"
              ? "Northern Ireland outward code"
              : result.kind === "eircode"
                ? "Irish Eircode"
                : "Irish Eircode routing key"}{" "}
          — thanks.
        </HelperText>
      )}
    </section>
  );
}