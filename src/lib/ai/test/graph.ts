
import {
  END,
  START,
  StateGraph,
} from "@langchain/langgraph";

import {
  AITestState,
  type AITestStateType,
} from "./state";

import { testJev as runTestJev } from "./jev";
import { applyPolicy } from "./policy";
import { testAiAgent } from "./ai-agent";

/*
 * Load the current conversation state.
 */
async function testLoadState(
  state: AITestStateType,
): Promise<Partial<AITestStateType>> {
  return {
    conversationStatus:
      state.conversationStatus ?? "AI_ACTIVE",

    appointmentStatus:
      state.appointmentStatus ?? "NONE",

    appointmentRequested:
      state.appointmentRequested ?? false,
  };
}

/*
 * Classify the latest customer message with Jev.
 */
async function testJevNode(
  state: AITestStateType,
): Promise<Partial<AITestStateType>> {
  return runTestJev(state);
}

/*
 * Apply deterministic conversation policy.
 */
// async function testPolicy(
//   state: AITestStateType,
// ): Promise<Partial<AITestStateType>> {
//   return applyPolicy(state);
// }


async function testPolicy(
  state: AITestStateType,
): Promise<Partial<AITestStateType>> {
  const result = applyPolicy(state);

  console.log("\n========== TEST LAB POLICY ==========");
  console.log("Latest message:", state.newMessage);
  console.log("Jev decision:", state.jevDecision);
  console.log("Unclear count before:", state.unclearCount);
  console.log("Policy result:", result);
  console.log("=====================================\n");

  return result;
}


/*
 * Decide whether DeepSeek should run.
 *
 * Safety emergencies and legitimate appointment requests
 * take priority over spam suppression.
 *
 * Spam and low-intent conversations must not reach DeepSeek.
 */
// function routeAfterPolicy(
//   state: AITestStateType,
// ): "aiAgent" | typeof END {
//   const decision = state.jevDecision;

//   // Do not suppress potential safety emergencies.
//   if (decision?.isEmergency === true) {
//     return "aiAgent";
//   }

//   // Allow legitimate scheduling requests to proceed.
//   if (decision?.isAppointmentRequest === true) {
//     return "aiAgent";
//   }

//   // Suppress messages classified as spam.
//   if (decision?.isSpam === true) {
//     return END;
//   }

//   // Stay silent after the low-intent limit is reached.
//   if (state.lowIntent) {
//     return END;
//   }

//   return "aiAgent";
// }


function routeAfterPolicy(
  state: AITestStateType,
): "aiAgent" | typeof END {
  const decision = state.jevDecision;

  let route: "aiAgent" | typeof END = "aiAgent";
  let reason = "Normal AI response";

  if (decision?.isEmergency === true) {
    reason = "Emergency: allow AI safety response";
  } else if (decision?.isAppointmentRequest === true) {
    reason = "Appointment request: allow AI";
  } else if (decision?.isSpam === true) {
    route = END;
    reason = "Spam detected: stop before AI";
  } else if (state.lowIntent) {
    route = END;
    reason = "Low intent: stop before AI";
  }

  console.log("\n========== TEST LAB ROUTING ==========");
  console.log("Latest message:", state.newMessage);
  console.log("Spam:", decision?.isSpam);
  console.log("Meaningful:", decision?.isMeaningfulResponse);
  console.log("Unclear count:", state.unclearCount);
  console.log("Low intent:", state.lowIntent);
  console.log("Selected route:", route === END ? "END" : route);
  console.log("Reason:", reason);
  console.log("======================================\n");

  return route;
}


const workflow = new StateGraph(AITestState)
  .addNode("loadState", testLoadState)
  .addNode("jev", testJevNode)
  .addNode("policy", testPolicy)
  .addNode("aiAgent", testAiAgent)

  .addEdge(START, "loadState")
  .addEdge("loadState", "jev")
  .addEdge("jev", "policy")
  .addConditionalEdges("policy", routeAfterPolicy)
  .addEdge("aiAgent", END);

export const aiTestGraph = workflow.compile();
