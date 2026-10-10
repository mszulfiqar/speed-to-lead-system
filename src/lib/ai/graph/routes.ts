// // import type { HVACStateType } from "./state";

// // export function routeAfterJev(
// //   state: HVACStateType
// // ): "emergency" | "handoff" | "extract" | "continue" {
// //   const decision = state.jevDecision;

// //   if (!decision) {
// //     return "continue";
// //   }

// //   if (decision.isEmergency) {
// //     return "emergency";
// //   }

// //   if (decision.shouldHandoff) {
// //     return "handoff";
// //   }

// //   if (decision.shouldExtract) {
// //     return "extract";
// //   }

// //   return "continue";
// // }



// import type { HVACStateType } from "./state";

// export function routeAfterJev(
//   state: HVACStateType
// ):
//   | "emergency"
//   | "appointment"
//   | "handoff"
//   | "extract"
//   | "continue" {
//   const decision = state.jevDecision;

//   if (!decision) {
//     return "continue";
//   }

//   if (decision.isEmergency) {
//     return "emergency";
//   }

//   if (decision.isAppointmentRequest) {
//     return "appointment";
//   }

//   if (decision.shouldHandoff) {
//     return "handoff";
//   }

//   if (decision.shouldExtract) {
//     return "extract";
//   }

//   return "continue";
// }


import type { HVACStateType } from "./state";

export function routeAfterJev(
    state: HVACStateType
): "emergency" | "appointment" | "handoff" | "extract" | "continue" {
    const decision = state.jevDecision;

    if (!decision) {
        return "continue";
    }

    if (decision.isEmergency) {
        return "emergency";
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