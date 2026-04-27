import type { Question, AnswerValue } from "./schema-types";
import { QuestionRenderer } from "./QuestionRenderer";
import type { WizardPage } from "./pages";
import { PairedSegmentedLikert } from "../components/ui/PairedSegmentedLikert";
import { BucketSortMatrix } from "../components/ui/BucketSortMatrix";
import { EmojiReactionMatrix } from "../components/ui/EmojiReactionMatrix";

interface PageRendererProps {
  page: WizardPage;
  answers: Record<string, AnswerValue>;
  onChange: (id: string, value: AnswerValue) => void;
  inlineBefore?: Record<string, React.ReactNode>;
}

export function PageRenderer({ page, answers, onChange, inlineBefore }: PageRendererProps) {
  if (page.emojiReaction) {
    const values: Record<string, number | null> = {};
    for (const pair of page.emojiReaction.pairs) {
      const pm = answers[pair.pmId];
      const fox = answers[pair.foxId];
      values[pair.pmId] = typeof pm === "number" ? pm : null;
      values[pair.foxId] = typeof fox === "number" ? fox : null;
    }
    return (
      <EmojiReactionMatrix
        prompt={page.emojiReaction.prompt}
        hint={page.emojiReaction.hint}
        emojis={page.emojiReaction.emojis}
        pairs={page.emojiReaction.pairs}
        values={values}
        onChange={onChange}
      />
    );
  }

  if (page.bucketSort) {
    const values: Record<string, number | null> = {};
    for (const item of page.bucketSort.items) {
      const v = answers[item.id];
      values[item.id] = typeof v === "number" ? v : null;
    }
    return (
      <BucketSortMatrix
        prompt={page.bucketSort.prompt}
        hint={page.bucketSort.hint}
        buckets={page.bucketSort.buckets}
        items={page.bucketSort.items}
        values={values}
        onChange={onChange}
      />
    );
  }

  if (page.paired) {
    const values: Record<string, number | null> = {};
    for (const pair of page.paired.pairs) {
      const pm = answers[pair.pmId];
      const fox = answers[pair.foxId];
      values[pair.pmId] = typeof pm === "number" ? pm : null;
      values[pair.foxId] = typeof fox === "number" ? fox : null;
    }
    return (
      <div className="md:rounded-xl md:bg-stone-50 md:p-2">
        <PairedSegmentedLikert
          prompt={page.paired.prompt}
          hint={page.paired.hint}
          leftLabel={page.paired.leftLabel}
          rightLabel={page.paired.rightLabel}
          anchors={page.paired.anchors}
          pairs={page.paired.pairs}
          values={values}
          onChange={onChange}
        />
      </div>
    );
  }

  const visibleQuestions = page.questions.filter((q) => !q.visibleIf || q.visibleIf(answers));
  return (
    <div className="divide-y divide-stone-200 md:space-y-8 md:divide-y-0">
      {visibleQuestions.map((q, i) => (
        <div key={q.id} className={i === 0 ? "pb-6 md:pb-0" : "py-6 md:py-0"}>
          {inlineBefore?.[q.id]}
          <div className="md:rounded-xl md:border md:border-stone-200 md:bg-white md:p-6">
            <QuestionRenderer
              question={q as Question}
              answers={answers}
              onAnswer={onChange}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
