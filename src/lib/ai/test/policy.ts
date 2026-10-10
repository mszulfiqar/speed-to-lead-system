
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
   * 1. Spam takes priority.
   * The graph should suppress the AI response.
   */
  if (decision?.isSpam === true) {
    return {
      action: "CONTINUE",
    };
  }

  /*
   * 2. A customer who is not ready to book
   * can still be a valuable lead.
   *
   * Keep the conversation active and continue
   * helping them. Do not classify them as low intent.
   */
  if (decision?.bookingReadiness === "NOT_READY") {
    return {
      unclearCount: 0,
      lowIntent: false,
      currentGoal: "QUALIFY",
      conversationStatus: "AI_ACTIVE",
      action: "CONTINUE",
    };
  }

  /*
   * 3. Meaningful messages reset the unclear counter.
   *
   * If the customer is ready to book, set the goal
   * to APPOINTMENT. Otherwise, continue qualifying.
   */
  if (decision?.isMeaningfulResponse === true) {
    const readyToBook =
      decision.bookingReadiness === "READY";

    return {
      unclearCount: 0,
      lowIntent: false,
      currentGoal: readyToBook
        ? "APPOINTMENT"
        : "QUALIFY",
      conversationStatus: "AI_ACTIVE",
      action: "CONTINUE",
    };
  }

  /*
   * 4. Stay silent while low intent is active.
   * A meaningful message or explicit NOT_READY
   * classification above can reactivate the session.
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

  /*
   * 5. Count unproductive messages.
   */
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
