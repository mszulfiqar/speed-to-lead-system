import type { HVACStateType } from "./state";

/**
 * First routing decision:
 * Run Jev before the AI agent so emergencies and spam
 * can bypass normal AI response generation.
 */
export function routeBeforeAgent(
  state: HVACStateType
): "emergency" | "spam" | "aiAgent" {
  const decision = state.jevDecision;

  // If Jev has no decision, allow the normal AI flow.
  if (!decision) {
    return "aiAgent";
  }

  // Safety takes priority.
  if (decision.isEmergency) {
    return "emergency";
  }

  // Stop spam before generating an AI response.
  if (decision.isSpam) {
    return "spam";
  }

  // All other messages continue to the AI agent.
  return "aiAgent";
}

/**
 * Second routing decision:
 * After Jev has classified the message and the AI agent
 * has responded, preserve the existing workflow.
 */
export function routeAfterJev(
  state: HVACStateType
):
  | "emergency"
  | "spam"
  | "appointment"
  | "handoff"
  | "extract"
  | "continue" {
  const decision = state.jevDecision;

  if (!decision) {
    return "continue";
  }

  if (decision.isEmergency) {
    return "emergency";
  }

  if (decision.isSpam) {
    return "spam";
  }

  if (decision.isAppointmentRequest) {
    return "appointment";
  }

  if (decision.shouldHandoff) {
    return "handoff";
  }

  if (decision.shouldExtract) {
    return "extract";
  }

  return "continue";
}

/**
 * After lead updates, send appointment requests for
 * human review. Otherwise, finish the workflow.
 */
export function routeAfterLeadUpdate(
  state: HVACStateType
): "handoff" | "end" {
  if (state.appointmentRequested) {
    return "handoff";
  }

  return "end";
}
