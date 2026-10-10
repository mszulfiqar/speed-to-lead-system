import { runJev } from "../jev";
import type { HVACStateType } from "../state";

export async function jevNode(
  state: HVACStateType
): Promise<Partial<HVACStateType>> {
  const conversation = state.messages.map((message) => {
    const type = message._getType();

    return `${type}: ${message.content}`;
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

  console.log("🧠 Jev decision:", decision);

  return {
    jevDecision: decision,
  };
}
