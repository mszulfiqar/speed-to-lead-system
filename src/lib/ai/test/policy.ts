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
  /*
   * Jev evaluates whether the latest message is meaningful
   * in the context of the conversation.
   *
   * The Test Lab graph must run Jev before this policy.
   */
  const meaningful =
    state.jevDecision?.isMeaningfulResponse === true;

  /*
   * Meaningful message:
   * Reset the unclear counter and reopen the conversation.
   */
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
   * Already in silent mode:
   * Keep the conversation silent until Jev identifies
   * meaningful new input.
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

  /*
   * Fourth unclear message:
   * Enter silent mode.
   */
  if (nextAction === "LOW_INTENT") {
    return {
      unclearCount: nextCount,
      lowIntent: true,
      currentGoal: "CLOSED",
      conversationStatus: "CLOSED",
      action: "CONTINUE",
    };
  }

  /*
   * Third unclear message:
   * Offer human assistance.
   */
  if (nextAction === "HUMAN_OFFER") {
    return {
      unclearCount: nextCount,
      lowIntent: false,
      currentGoal: "HUMAN",
      conversationStatus: "AI_ACTIVE",
      action: "CONTINUE",
    };
  }

  /*
   * Second unclear message:
   * Offer simple choices.
   */
  if (nextAction === "OPTIONS") {
    return {
      unclearCount: nextCount,
      lowIntent: false,
      currentGoal: "QUALIFY",
      conversationStatus: "AI_ACTIVE",
      action: "CONTINUE",
    };
  }

  /*
   * First unclear message:
   * Ask a simple clarification.
   */
  return {
    unclearCount: nextCount,
    lowIntent: false,
    currentGoal: "GENERAL",
    conversationStatus: "AI_ACTIVE",
    action: "CONTINUE",
  };
}