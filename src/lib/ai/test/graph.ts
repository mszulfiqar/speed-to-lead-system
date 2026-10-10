// import {
//   END,
//   START,
//   StateGraph,
// } from "@langchain/langgraph";

// import {
//   AITestState,
//   type AITestStateType,
// } from "./state";

// import { applyPolicy } from "./policy";
// import { testAiAgent } from "./ai-agent";

// /*
//  * Load persistent conversation state.
//  */
// async function testLoadState(
//   state: AITestStateType,
// ): Promise<Partial<AITestStateType>> {
//   return {
//     conversationStatus:
//       state.conversationStatus ?? "AI_ACTIVE",

//     appointmentStatus:
//       state.appointmentStatus ?? "NONE",

//     appointmentRequested:
//       state.appointmentRequested ?? false,
//   };
// }

// /*
//  * Apply deterministic conversation rules.
//  */
// async function testPolicy(
//   state: AITestStateType,
// ): Promise<Partial<AITestStateType>> {
//   return applyPolicy(state);
// }

// const workflow = new StateGraph(AITestState)
//   .addNode("loadState", testLoadState)
//   .addNode("policy", testPolicy)
//   .addNode("aiAgent", testAiAgent)

//   .addEdge(START, "loadState")
//   .addEdge("loadState", "policy")
//   .addEdge("policy", "aiAgent")
//   .addEdge("aiAgent", END);

// export const aiTestGraph = workflow.compile();



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
 * Run Jev to classify the latest customer message
 * using the available conversation context.
 */
async function testJevNode(
  state: AITestStateType,
): Promise<Partial<AITestStateType>> {
  return runTestJev(state);
}

/*
 * Apply deterministic conversation rules using Jev's decision.
 */
async function testPolicy(
  state: AITestStateType,
): Promise<Partial<AITestStateType>> {
  return applyPolicy(state);
}

/*
 * If low intent is active, skip DeepSeek.
 * Otherwise, generate the next AI response.
 */
function routeAfterPolicy(
  state: AITestStateType,
): "aiAgent" | typeof END {
  if (state.lowIntent) {
    return END;
  }

  return "aiAgent";
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
