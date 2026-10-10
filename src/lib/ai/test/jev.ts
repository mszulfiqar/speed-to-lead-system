import { runJev } from "../graph/jev";
import type { AITestStateType } from "./state";

export async function testJevNode(
  state: AITestStateType
): Promise<Partial<AITestStateType>> {
  const conversation = state.messages.map((message) => {
    const type = message._getType();

    return `${type}: ${String(message.content)}`;
  });

  const decision = await runJev({
    latestMessage: state.newMessage,

    lead: state.lead ?? {
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

    conversation,
  });

  console.log("🧪 Test Jev decision:", decision);

  return {
    jevDecision: decision,
  };
}