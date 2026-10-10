
import type { AITestStateType } from "./state";

export type UnclearAction =
  | "NORMAL"
  | "OPTIONS"
  | "HUMAN_OFFER"
  | "LOW_INTENT";

export function getUnclearAction(
  unclearCount: number,
): UnclearAction {
  if (unclearCount <= 1) return "NORMAL";
  if (unclearCount === 2) return "OPTIONS";
  if (unclearCount === 3) return "HUMAN_OFFER";

  return "LOW_INTENT";
}

export function applyPolicy(
  state: AITestStateType,
): Partial<AITestStateType> {
  const decision = state.jevDecision;

  /*
   * Spam takes priority over normal conversation handling.
   * The graph will use this decision to suppress AI replies.
   */
  if (decision?.isSpam === true) {
    return {
      action: "CONTINUE",
    };
  }

  /*
   * Meaningful input resets the unclear-message counter.
   */
  const meaningful =
    decision?.isMeaningfulResponse === true;

  if (meaningful) {
    return {
      unclearCount: 0,
      lowIntent: false,
      currentGoal: "QUALIFY",
      conversationStatus: "AI_ACTIVE",
      action: "CONTINUE",
    };
  }

  /*
   * Remain in silent mode until meaningful input arrives.
   */
  if (state.lowIntent) {
    return {
      unclearCount: state.unclearCount,
      lowIntent: true,
      currentGoal: "CLOSED",
      conversationStatus: "CLOSED",
      action: "CONTINUE",
    };
  }

  const nextCount = state.unclearCount + 1;
  const nextAction = getUnclearAction(nextCount);

  if (nextAction === "LOW_INTENT") {
    return {
      unclearCount: nextCount,
      lowIntent: true,
      currentGoal: "CLOSED",
      conversationStatus: "CLOSED",
      action: "CONTINUE",
    };
  }

  if (nextAction === "HUMAN_OFFER") {
    return {
      unclearCount: nextCount,
      lowIntent: false,
      currentGoal: "HUMAN",
      conversationStatus: "AI_ACTIVE",
      action: "CONTINUE",
    };
  }

  if (nextAction === "OPTIONS") {
    return {
      unclearCount: nextCount,
      lowIntent: false,
      currentGoal: "QUALIFY",
      conversationStatus: "AI_ACTIVE",
      action: "CONTINUE",
    };
  }

  return {
    unclearCount: nextCount,
    lowIntent: false,
    currentGoal: "GENERAL",
    conversationStatus: "AI_ACTIVE",
    action: "CONTINUE",
  };
}
