import { useEffect, useState } from "react";
import { useWizard } from "./use-wizard";
import { PageRenderer } from "./PageRenderer";
import { wizardPages } from "./pages";
import { WelcomePage } from "../pages/WelcomePage";
import { ThankYouPage } from "../pages/ThankYouPage";
import { Button } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/ProgressBar";
import { SpeciesRevealPanel } from "../components/ui/SpeciesRevealPanel";
import { FactCard } from "../components/ui/FactCard";
import { SectionBanner } from "../components/ui/SectionBanner";
import { submit, type SubmitResult } from "./submit";
import { clearState } from "./persistence";

export function SurveyWizard() {
  const wiz = useWizard();
  const page = wizardPages.find((p) => p.id === wiz.currentStepId)!;
  const isFirst = wiz.currentIndex === 0;
  const isThanks = wiz.currentStepId === "thanks";
  const isDemographics = wiz.currentStepId === "demographics";
  const isIntro = wiz.currentStepId === "intro";
  const isInteractions = wiz.currentStepId === "interactions";
  const isRisk = wiz.currentStepId === "risk";
  const isTolerance = wiz.currentStepId === "tolerance";

  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitStatus("submitting");
    setSubmitError(null);
    const result: SubmitResult = await submit(
      wiz.state.submissionId,
      wiz.state.startedAt,
      wiz.state.answers,
    );
    if (result.ok) {
      clearState();
      setSubmitStatus("idle");
      wiz.goTo("thanks");
    } else {
      setSubmitStatus("error");
      setSubmitError(result.message);
    }
  };

  useEffect(() => {
    if (!isDemographics) setSubmitStatus("idle");
  }, [isDemographics]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-3 py-6 md:gap-8 md:px-4 md:py-12">
      {!isThanks && !isFirst && (
        <ProgressBar
          current={wiz.currentIndex}
          total={wiz.totalSteps}
          label={page.title}
          meaningfulCurrent={wiz.currentIndex}
          meaningfulTotal={wiz.totalSteps - 2}
        />
      )}

      <section className="survey-card p-4 md:p-10">
        {wiz.currentStepId === "welcome" ? (
          <WelcomePage
            consented={wiz.state.answers.__consent === true}
            onConsentChange={(v) => wiz.setAnswer("__consent", v as never)}
            region={
              typeof wiz.state.answers.__region === "string"
                ? (wiz.state.answers.__region as string)
                : null
            }
            onRegionChange={(v) => wiz.setAnswer("__region", v as never)}
            onStart={wiz.advance}
          />
        ) : isThanks ? (
          <ThankYouPage submissionId={wiz.state.submissionId} />
        ) : (
          <div className="space-y-8">
            <header className="space-y-2">
              <h1 className="!font-serif !text-2xl md:!text-3xl">{page.title}</h1>
              {page.intro && (
                <p className="max-w-prose text-stone-700">{page.intro}</p>
              )}
            </header>

            {isRisk && (
              <SectionBanner
                emoji="🎯"
                callout="Switch it up"
                body="Now we're sorting cards into risk levels. Drag them around — there's no wrong way."
                tint="amber"
              />
            )}
            {isTolerance && (
              <SectionBanner
                emoji="😊"
                callout="One more switch"
                body="Statements about coexisting. Tap the face that best matches how you feel."
                tint="forest"
              />
            )}

            <PageRenderer
              page={page}
              answers={wiz.state.answers as Record<string, never>}
              onChange={(id, v) => wiz.setAnswer(id, v)}
            />

            {isIntro && <SpeciesRevealPanel answers={wiz.state.answers} />}
            {isInteractions && (
              <div className="mt-8">
                <FactCard seed={wiz.state.submissionId} />
              </div>
            )}

            <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-6">
              <Button variant="secondary" size="lg" onClick={wiz.goBack} disabled={isFirst}>
                Back
              </Button>
              {isDemographics ? (
                <div className="flex flex-col items-end gap-2">
                  <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={!wiz.canProceed || submitStatus === "submitting"}
                  >
                    {submitStatus === "submitting" ? "Submitting…" : "Submit survey"}
                  </Button>
                  {submitStatus === "error" && (
                    <p className="text-sm text-red-700">
                      Couldn't submit: {submitError}.{" "}
                      <button type="button" className="underline" onClick={handleSubmit}>
                        Try again
                      </button>
                    </p>
                  )}
                </div>
              ) : (
                <Button size="lg" onClick={wiz.advance} disabled={!wiz.canProceed}>
                  Next
                </Button>
              )}
            </nav>
          </div>
        )}
      </section>

      {!isThanks && (
        <footer className="text-center text-xs text-stone-500">
          Ulster University · School of Geography and Environmental Sciences · Research survey
        </footer>
      )}
    </main>
  );
}

