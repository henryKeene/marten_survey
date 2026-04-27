import { Button } from "../components/ui/Button";
import { FactCard } from "../components/ui/FactCard";

interface ThankYouPageProps {
  submissionId: string;
  onRestart: () => void;
}

export function ThankYouPage({ submissionId, onRestart }: ThankYouPageProps) {
  return (
    <article className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest-100 text-4xl">
        <span aria-hidden="true">🌿</span>
      </div>

      <h1 className="!font-serif">Thank you for taking part</h1>

      <p className="mx-auto max-w-prose text-base text-stone-700">
        Your response has been recorded and will contribute to research on how people across the
        island of Ireland live alongside foxes and pine martens.
      </p>

      <p className="mx-auto max-w-prose text-base text-stone-700">
        If you know other people who might be willing to take part, please share this page with
        them. Their views matter too.
      </p>

      <div className="mx-auto max-w-prose text-left">
        <FactCard variant="celebratory" seed={submissionId} />
      </div>

      <div className="flex justify-center">
        <Button size="lg" onClick={onRestart}>
          Take it again
        </Button>
      </div>
    </article>
  );
}
