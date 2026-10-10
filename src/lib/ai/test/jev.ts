// 


import { runJev } from "../graph/jev";
import type { AITestStateType } from "./state";

export async function testJev(
  state: AITestStateType,
): Promise<Partial<AITestStateType>> {
  const lead = state.lead;

  const conversation = state.messages
    .slice(0, -1)
    .map((message) => {
      const role =
        message._getType() === "human" ? "Customer" : "Assistant";

      const content =
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content);

      return `${role}: ${content}`;
    });

  const jevDecision = await runJev({
    latestMessage: state.newMessage,
    lead: {
      service: lead?.service ?? null,
      problem: lead?.problem ?? null,
      urgency: lead?.urgency ?? null,
      propertyType: lead?.propertyType ?? null,
      address: lead?.address ?? null,
      city: lead?.city ?? null,
      state: lead?.state ?? null,
      zipCode: lead?.zipCode ?? null,
      preferredTime: lead?.preferredTime ?? null,
    },
    conversation,
  });

  return { jevDecision };
}
