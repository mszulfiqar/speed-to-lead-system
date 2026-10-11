
import { Annotation } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

export const HVACState = Annotation.Root({
  /*
   * ============================================================
   * IDENTIFIERS
   * ============================================================
   */

  conversationId: Annotation<string>(),

  customerId: Annotation<string>(),

  leadId: Annotation<string>(),

  /*
   * ============================================================
   * CURRENT CUSTOMER MESSAGE
   * ============================================================
   */

  newMessage: Annotation<string>(),

  /*
   * ============================================================
   * CONVERSATION HISTORY
   * ============================================================
   */

  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => [
      ...current,
      ...update,
    ],

    default: () => [],
  }),

  /*
   * ============================================================
   * LEAD DATA
   * ============================================================
   */

  lead: Annotation<{
    service: string | null;

    problem: string | null;

    urgency:
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | null;

    propertyType:
      | "RESIDENTIAL"
      | "COMMERCIAL"
      | null;

    address: string | null;

    city: string | null;

    state: string | null;

    zipCode: string | null;

    preferredTime: string | null;
  } | null>(),

  /*
   * ============================================================
   * JEV DECISION
   * ============================================================
   */

  jevDecision: Annotation<{
    /*
     * Does the latest customer message actually contain
     * meaningful information?
     */
    isMeaningfulResponse: boolean;

    /*
     * Does the message contain new/changed lead information?
     */
    shouldExtract: boolean;

    /*
     * Does a human need to become involved?
     */
    shouldHandoff: boolean;

    /*
     * Is the customer requesting/discussing an appointment?
     */
    isAppointmentRequest: boolean;

    /*
     * Is there an emergency/safety issue?
     */
    isEmergency: boolean;

    /*
     * Is the latest customer message clearly spam?
     */
    isSpam: boolean;
  } | null>(),

  /*
   * ============================================================
   * APPOINTMENT
   * ============================================================
   */

  appointmentRequested:
    Annotation<boolean>(),

  /*
   * ============================================================
   * ACTION
   * ============================================================
   */

  action: Annotation<
    | "CONTINUE"
    | "HANDOFF"
    | "TOOL"
    | null
  >(),

  /*
   * ============================================================
   * HANDOFF
   * ============================================================
   */

  handoffReason:
    Annotation<string | null>(),

  /*
   * ============================================================
   * TOOLS
   * ============================================================
   */

  pendingTool: Annotation<{
    name: string;

    arguments: Record<string, unknown>;
  } | null>(),

  toolResult:
    Annotation<unknown | null>(),
});

export type HVACStateType =
  typeof HVACState.State;
