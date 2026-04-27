import { useMemo, useState } from "react";
import type { AnswerValue, Question } from "./schema-types";
import { questionsById } from "./schema.generated";
import { FieldLabel, HelperText } from "../components/ui/FieldLabel";
import { LabelText } from "../components/ui/LabelText";
import { RadioGroup } from "../components/ui/RadioGroup";
import { CheckboxGroup } from "../components/ui/CheckboxGroup";
import { TextInput } from "../components/ui/TextInput";
import { TextArea } from "../components/ui/TextArea";
import { RiskSlider } from "../components/ui/RiskSlider";
import { SegmentedLikert } from "../components/ui/SegmentedLikert";
import { SegmentedLikertGroup } from "../components/ui/SegmentedLikertGroup";
import { ChoiceMatrix } from "../components/ui/ChoiceMatrix";
import { PhotoGridIdentify } from "../components/ui/PhotoGridIdentify";

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
      const usePhotoGrid = PHOTO_GRID_QUESTION_IDS.has(q.id);
      return (
        <section aria-labelledby={labelId} className="space-y-3">
          <FieldLabel id={labelId} required={q.required}>
            <LabelText text={q.prompt} />
          </FieldLabel>
          {q.hint && <HelperText>{q.hint}</HelperText>}
          {usePhotoGrid ? (
            <PhotoGridIdentify
              choices={q.choices.map((c) => ({
                ...c,
                thumbnail: SPECIES_THUMBNAILS[c.value],
              }))}
              value={typeof value === "string" ? value : null}
              onChange={(v) => onAnswer(q.id, v)}
              ariaLabel={q.prompt}
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

    case "multi":
      return (
        <section aria-labelledby={labelId} className="space-y-3">
          <FieldLabel id={labelId} required={q.required}>
            <LabelText text={q.prompt} />
          </FieldLabel>
          {q.hint && <HelperText>{q.hint}</HelperText>}
          <CheckboxGroup
            name={q.id}
            choices={q.choices}
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={(v) => onAnswer(q.id, v)}
            ariaLabelledby={labelId}
          />
        </section>
      );

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
      return (
        <section aria-labelledby={labelId} className="space-y-4">
          <span id={labelId} className="sr-only">
            {q.prompt}
          </span>
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
            renderAfterRow={
              q.followUps
                ? (itemId) => {
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
                : undefined
            }
          />
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