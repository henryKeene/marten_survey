import { useCallback, useEffect, useMemo, useState } from "react";
import type { AnswerValue } from "./schema-types";
import type { StepId } from "./pages";
import { stepIds } from "./wizard-state";
import {
  canProceedFrom,
  initialState,
  nextStepId,
  prevStepId,
  pruneHiddenAnswers,
  stepIndex,
} from "./wizard-state";
import type { WizardState } from "./wizard-state";
import { clearState } from "./persistence";

export interface UseWizard {
  state: WizardState;
  currentStepId: StepId;
  currentIndex: number;
  totalSteps: number;
  canProceed: boolean;
  setAnswer: (id: string, value: AnswerValue) => void;
  advance: () => void;
  goBack: () => void;
  goTo: (id: StepId) => void;
  reset: () => void;
}

export function useWizard(): UseWizard {
  const [state, setState] = useState<WizardState>(() => initialState());

  const setAnswer = useCallback((id: string, value: AnswerValue) => {
    setState((s) => {
      const nextAnswers = { ...s.answers, [id]: value };
      const pruned = pruneHiddenAnswers(nextAnswers);
      return { ...s, answers: pruned };
    });
  }, []);

  const advance = useCallback(() => {
    setState((s) => {
      if (!canProceedFrom(s.currentStepId, s.answers)) return s;
      return { ...s, currentStepId: nextStepId(s.currentStepId) };
    });
  }, []);

  const goBack = useCallback(() => {
    setState((s) => ({ ...s, currentStepId: prevStepId(s.currentStepId) }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // Scroll to top whenever the step changes (Next, Back, or jump). Runs after
  // render commits so the browser isn't racing the new page layout.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [state.currentStepId]);

  const goTo = useCallback((id: StepId) => {
    setState((s) => ({ ...s, currentStepId: id }));
  }, []);

  const reset = useCallback(() => {
    clearState();
    setState(initialState());
  }, []);

  const canProceed = useMemo(
    () => canProceedFrom(state.currentStepId, state.answers),
    [state.currentStepId, state.answers],
  );

  return {
    state,
    currentStepId: state.currentStepId,
    currentIndex: stepIndex(state.currentStepId),
    totalSteps: stepIds.length,
    canProceed,
    setAnswer,
    advance,
    goBack,
    goTo,
    reset,
  };
}
