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
  isMeaningfulResponse: boolean;
  shouldExtract: boolean;
  shouldHandoff: boolean;
  isAppointmentRequest: boolean;
  isEmergency: boolean;
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
   * Jev decision.
   *
   * We are not using Jev yet in the Test Lab,
   * but we keep the state field because production
   * will eventually use it.
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
   * How many consecutive customer messages
   * failed to provide meaningful information?
   */
  unclearCount: Annotation<number>({
    value: (_current, update) => update,
    default: () => 0,
  }),

  /*
   * Customer has stopped making useful progress.
   */
  lowIntent: Annotation<boolean>({
    value: (_current, update) => update,
    default: () => false,
  }),

  /*
   * The last question asked by the AI.
   *
   * This becomes very useful later when we bring
   * Jev back because "yes" only makes sense relative
   * to the previous question.
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