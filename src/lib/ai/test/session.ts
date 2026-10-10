
import { HumanMessage } from "@langchain/core/messages";

import {
  type AITestStateType,
} from "./state";

import { aiTestGraph } from "./graph";

/*
 * In-memory sessions for the Test Lab.
 *
 * This is intentionally temporary.
 * Production will store conversation state in the database.
 */
const sessions = new Map<string, AITestStateType>();

/*
 * Create the initial state for a new Test Lab session.
 */
function createInitialState(
  sessionId: string,
): AITestStateType {
  return {
    conversationId: sessionId,

    newMessage: "",

    messages: [],

    lead: {
      service: null,
      problem: null,
      urgency: null,
      propertyType: null,
      address: null,
      city: null,
      state: null,
      zipCode: null,
      preferredTime: null,
    },

    jevDecision: null,

    // Booking readiness starts unknown.
    bookingReadiness: "UNKNOWN",

    appointmentRequested: false,

    conversationStatus: "AI_ACTIVE",

    appointmentStatus: "NONE",

    // Conversation-control state.
    currentGoal: "GENERAL",

    unclearCount: 0,

    lowIntent: false,

    lastQuestion: null,

    action: null,

    handoffReason: null,

    pendingTool: null,

    toolResult: null,
  };
}

/*
 * Get an existing session.
 *
 * If it doesn't exist, create it.
 */
export function getTestSession(
  sessionId: string,
): AITestStateType {
  const existing = sessions.get(sessionId);

  if (existing) {
    return existing;
  }

  const initialState = createInitialState(sessionId);

  sessions.set(sessionId, initialState);

  return initialState;
}

/*
 * Run one customer message through the Test Graph.
 */
export async function runAITest(
  sessionId: string,
  userMessage: string,
): Promise<AITestStateType> {
  const previousState = getTestSession(sessionId);

  const humanMessage = new HumanMessage({
    content: userMessage,
  });

  const result = await aiTestGraph.invoke({
    conversationId: sessionId,

    newMessage: userMessage,

    messages: [
      ...previousState.messages,
      humanMessage,
    ],

    lead: previousState.lead,

    jevDecision: null,

    // Preserve booking readiness between messages.
    bookingReadiness:
      previousState.bookingReadiness,

    appointmentRequested:
      previousState.appointmentRequested,

    conversationStatus:
      previousState.conversationStatus,

    appointmentStatus:
      previousState.appointmentStatus,

    currentGoal:
      previousState.currentGoal,

    unclearCount:
      previousState.unclearCount,

    lowIntent:
      previousState.lowIntent,

    lastQuestion:
      previousState.lastQuestion,

    action: null,

    handoffReason: null,

    pendingTool: null,

    toolResult: null,
  });

  /*
   * Save the complete resulting state.
   */
  const nextState = result as AITestStateType;

  sessions.set(sessionId, nextState);

  return nextState;
}

/*
 * Reset one Test Lab session.
 */
export function resetAITest(
  sessionId: string,
): AITestStateType {
  const initialState = createInitialState(sessionId);

  sessions.set(sessionId, initialState);

  return initialState;
}

/*
 * Get the current state without running the graph.
 */
export function getAITest(
  sessionId: string,
): AITestStateType {
  return getTestSession(sessionId);
}