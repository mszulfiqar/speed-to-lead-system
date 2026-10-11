
import type { HVACStateType } from "./state";

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

  /*
   * Safety takes priority over all other decisions.
   */
  if (decision.isEmergency) {
    return "emergency";
  }

  /*
   * Suppress clearly identified spam before normal
   * appointment, handoff, or extraction processing.
   */
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

export function routeAfterLeadUpdate(
  state: HVACStateType
): "handoff" | "end" {
  if (state.appointmentRequested) {
    return "handoff";
  }

  return "end";
}
