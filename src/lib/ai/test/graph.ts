import {
  END,
  START,
  StateGraph,
} from "@langchain/langgraph";

import {
  AITestState,
  type AITestStateType,
} from "./state";

import { applyPolicy } from "./policy";
import { testAiAgent } from "./ai-agent";

/*
 * Load persistent conversation state.
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
 * Apply deterministic conversation rules.
 */
async function testPolicy(
  state: AITestStateType,
): Promise<Partial<AITestStateType>> {
  return applyPolicy(state);
}

const workflow = new StateGraph(AITestState)
  .addNode("loadState", testLoadState)
  .addNode("policy", testPolicy)
  .addNode("aiAgent", testAiAgent)

  .addEdge(START, "loadState")
  .addEdge("loadState", "policy")
  .addEdge("policy", "aiAgent")
  .addEdge("aiAgent", END);

export const aiTestGraph = workflow.compile();