import type { AITestStateType } from "./state";

export type UnclearAction =
  | "NORMAL"
  | "OPTIONS"
  | "HUMAN_OFFER"
  | "LOW_INTENT";

export function getUnclearAction(unclearCount: number): UnclearAction {
  if (unclearCount <= 1) return "NORMAL";
  if (unclearCount === 2) return "OPTIONS";
  if (unclearCount === 3) return "HUMAN_OFFER";
  return "LOW_INTENT";
}

export function isClearlyMeaningful(message: string): boolean {
  const text = message.trim().toLowerCase();

  if (!text) return false;

  const unclearMessages = new Set([
    "hi",
    "hello",
    "hey",
    "ok",
    "okay",
    "oky",
    "k",
    "hmm",
    "hm",
    "fine",
    "alright",
    "sure",
    "ouch",
    "yeah",
    "yep",
    "no",
    "thanks",
    "thank you",
    "never mind",
  ]);

  return !unclearMessages.has(text);
}

export function applyPolicy(
  state: AITestStateType,
): Partial<AITestStateType> {
  const meaningful = isClearlyMeaningful(state.newMessage);

  /*
   * Meaningful message:
   *
   * If the customer was previously marked low-intent,
   * reopen the conversation.
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
   * Already low-intent:
   *
   * Do NOT increase the counter forever.
   * Do NOT ask another question.
   * Do NOT call the AI.
   * Just stay silent.
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
  const action = getUnclearAction(nextCount);

  /*
   * Fourth unclear message:
   * enter silent/low-intent mode.
   */
  if (action === "LOW_INTENT") {
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
   * offer human help.
   */
  if (action === "HUMAN_OFFER") {
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
   * give options.
   */
  if (action === "OPTIONS") {
    return {
      unclearCount: nextCount,
      lowIntent: false,
      currentGoal: "QUALIFY",
      conversationStatus: "AI_ACTIVE",
      action: "CONTINUE",
    };
  }

  /*
   * First unclear message.
   */
  return {
    unclearCount: nextCount,
    lowIntent: false,
    currentGoal: "GENERAL",
    conversationStatus: "AI_ACTIVE",
    action: "CONTINUE",
  };
}