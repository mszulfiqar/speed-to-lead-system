
import { Annotation } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

export type TestConversationStatus =
  | "AI_ACTIVE"
  | "WAITING_FOR_HUMAN"
  | "HUMAN_ACTIVE"
  | "CLOSED";

export type TestAppointmentStatus =
  | "NONE"
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED";

export type TestBookingReadiness =
  | "READY"
  | "NOT_READY"
  | "UNKNOWN";

export type TestConversationGoal =
  | "GENERAL"
  | "QUALIFY"
  | "APPOINTMENT"
  | "HUMAN"
  | "CLOSED";

type TestLead = {
  service: string | null;
  problem: string | null;
  urgency: "LOW" | "MEDIUM" | "HIGH" | null;
  propertyType: "RESIDENTIAL" | "COMMERCIAL" | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  preferredTime: string | null;
};

type TestJevDecision = {
  // Is the customer's message meaningful in context?
  isMeaningfulResponse: boolean;

  // Does the message contain new lead information?
  shouldExtract: boolean;

  // Does the situation require human involvement?
  shouldHandoff: boolean;

  // Is the customer asking to schedule service?
  isAppointmentRequest: boolean;

  // Is there a potential safety emergency?
  isEmergency: boolean;

  // Is the message spam or abusive content?
  isSpam: boolean;

  // Is the customer ready to schedule an appointment?
  bookingReadiness: TestBookingReadiness;
};

export const AITestState = Annotation.Root({
  /*
   * Conversation identity
   */
  conversationId: Annotation<string>({
    value: (_current, update) => update,
    default: () => "",
  }),

  /*
   * Latest customer message
   */
  newMessage: Annotation<string>({
    value: (_current, update) => update,
    default: () => "",
  }),

  /*
   * Full conversation history
   */
  messages: Annotation<BaseMessage[]>({
    value: (current, update) => [...current, ...update],
    default: () => [],
  }),

  /*
   * Structured lead information
   */
  lead: Annotation<TestLead | null>({
    value: (_current, update) => update,
    default: () => null,
  }),

  /*
   * Jev decision
   */
  jevDecision: Annotation<TestJevDecision | null>({
    value: (_current, update) => update,
    default: () => null,
  }),

  /*
   * Appointment state
   */
  appointmentRequested: Annotation<boolean>({
    value: (_current, update) => update,
    default: () => false,
  }),

  appointmentStatus: Annotation<TestAppointmentStatus>({
    value: (_current, update) => update,
    default: () => "NONE",
  }),

  /*
   * Customer booking readiness.
   * Separate from spam and low-intent handling.
   */
  bookingReadiness: Annotation<TestBookingReadiness>({
    value: (_current, update) => update,
    default: () => "UNKNOWN",
  }),

  /*
   * Conversation state
   */
  conversationStatus: Annotation<TestConversationStatus>({
    value: (_current, update) => update,
    default: () => "AI_ACTIVE",
  }),

  /*
   * What are we currently trying to accomplish?
   */
  currentGoal: Annotation<TestConversationGoal>({
    value: (_current, update) => update,
    default: () => "GENERAL",
  }),

  /*
   * Consecutive customer messages that failed
   * to provide meaningful information.
   */
  unclearCount: Annotation<number>({
    value: (_current, update) => update,
    default: () => 0,
  }),

  /*
   * Customer has stopped making useful progress.
   * This does not mean the customer is unready to book.
   */
  lowIntent: Annotation<boolean>({
    value: (_current, update) => update,
    default: () => false,
  }),

  /*
   * The last question asked by the AI.
   */
  lastQuestion: Annotation<string | null>({
    value: (_current, update) => update,
    default: () => null,
  }),

  /*
   * General graph action
   */
  action: Annotation<"CONTINUE" | "HANDOFF" | "TOOL" | null>({
    value: (_current, update) => update,
    default: () => null,
  }),

  /*
   * Why a human takeover happened.
   */
  handoffReason: Annotation<string | null>({
    value: (_current, update) => update,
    default: () => null,
  }),

  /*
   * Tool execution state
   */
  pendingTool: Annotation<{
    name: string;
    arguments: Record<string, unknown>;
  } | null>({
    value: (_current, update) => update,
    default: () => null,
  }),

  toolResult: Annotation<unknown | null>({
    value: (_current, update) => update,
    default: () => null,
  }),
});

export type AITestStateType = typeof AITestState.State;
