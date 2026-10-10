import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenRouter } from "@langchain/openrouter";

import type { AITestStateType } from "./state";
import { getUnclearAction } from "./policy";

/*
 * Test Lab model
 */
const model = new ChatOpenRouter({
  model: "deepseek/deepseek-v4-flash",
  temperature: 0.1,
  maxRetries: 2,
});

/*
 * Test Lab AI Agent
 */
export async function testAiAgent(
  state: AITestStateType,
): Promise<Partial<AITestStateType>> {
  /*
   * ============================================================
   * SILENT MODE
   * ============================================================
   *
   * Once the customer has reached low-intent mode, the AI must
   * stop replying to additional low-signal messages.
   *
   * The customer's message is still stored by the session.
   * We simply don't generate another AI response.
   */
  if (state.lowIntent) {
    return {
      messages: [],
      action: "CONTINUE",
      conversationStatus: "CLOSED",
    };
  }

  /*
   * Current lead information
   */
  const lead = state.lead;

  const leadContext = `
Current lead information:

Service: ${lead?.service ?? "unknown"}
Problem: ${lead?.problem ?? "unknown"}
Urgency: ${lead?.urgency ?? "unknown"}
Property type: ${lead?.propertyType ?? "unknown"}
Address: ${lead?.address ?? "unknown"}
City: ${lead?.city ?? "unknown"}
State: ${lead?.state ?? "unknown"}
ZIP code: ${lead?.zipCode ?? "unknown"}
Preferred time: ${lead?.preferredTime ?? "unknown"}
`;

  /*
   * Policy state
   */
  const policyAction = getUnclearAction(state.unclearCount);

  const policyContext = `
Conversation policy:

Unclear message count: ${state.unclearCount}
Current goal: ${state.currentGoal}
Policy action: ${policyAction}
Low intent: ${state.lowIntent ? "YES" : "NO"}
Conversation status: ${state.conversationStatus}
Last question: ${state.lastQuestion ?? "none"}

Policy rules:

- NORMAL:
  Respond naturally and continue the conversation.

- OPTIONS:
  The customer has not provided useful information after repeated
  unclear responses. Give a small number of simple choices.
  Do NOT assume which choice applies.

- HUMAN_OFFER:
  Offer the customer the option to speak with a human.
  Do not continue asking qualification questions.

- LOW_INTENT:
  The conversation is already in silent mode.
  Do not generate another response.
`;

  /*
   * Conversation history
   */
  const previousMessages = state.messages.slice(0, -1);

  const conversationHistory = previousMessages
    .map((message) => {
      const role =
        message._getType() === "human"
          ? "Customer"
          : message._getType() === "ai"
            ? "Assistant"
            : "System";

      const content =
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content);

      return `${role}: ${content}`;
    })
    .join("\n");

  /*
   * System instructions
   */
  const systemPrompt = `
You are a friendly, professional customer-service representative.

You are being tested in an AI Speed-to-Lead Test Lab.

Your job is to have a natural conversation with a customer while
collecting useful information when the customer actually provides it.

IMPORTANT:

1. NEVER assume the customer has an HVAC problem.

Do not assume:
- AC problem
- heating problem
- repair
- maintenance
- installation
- emergency
- appointment
- location
- property type
- service type

unless the customer actually tells you.

2. Greetings are NOT useful lead information.

Examples:
- "hi"
- "hello"
- "hey"

Respond with a simple greeting.

Do not immediately start asking detailed HVAC questions.

3. Vague responses are NOT answers.

Examples:
- "ok"
- "okay"
- "oky"
- "k"
- "hmm"
- "sure"

Do not pretend that these messages contain information.

4. Reactions are NOT automatically HVAC information.

For example:

Customer:
"ouch"

Do NOT say:
"Sorry your AC is having trouble."

Instead stay neutral, such as:
"What happened?"

5. NEVER invent information.

If the customer has not said their service, problem, location,
property type, or preferred time, keep it unknown.

6. Use conversation history.

Pay attention to the assistant's previous question.

A response such as "yes" can only be considered an answer when
the previous question makes "yes" a meaningful answer.

For example:

Assistant:
"Is the system running?"

Customer:
"yes"

This is meaningful.

But:

Assistant:
"What is your address?"

Customer:
"yes"

This is NOT an address.

7. Ask ONE useful question at a time.

Do not ask five qualification questions in one message.

8. Keep responses short and natural.

This is a customer-service conversation, not a long explanation.

9. Do not diagnose with certainty.

Avoid statements such as:
"Your compressor is definitely broken."

Instead use cautious language such as:
"It could be related to..."

10. Respect the policy state provided below.

If policy says NORMAL:
Continue naturally.

If policy says OPTIONS:
Give simple choices and do not assume which one applies.

If policy says HUMAN_OFFER:
Offer human assistance and stop qualification questions.

If policy says LOW_INTENT:
DO NOT RESPOND.

The application code handles silent mode.

11. If the customer provides meaningful information after previously
being unclear, respond to the new information naturally.

For example:

Customer:
"hi"

Assistant:
"Hi! How can we help you today?"

Customer:
"oky"

Assistant:
"Are you looking for cooling, heating, or something else?"

Customer:
"My AC isn't cooling."

Now treat that as meaningful information and continue HVAC
qualification naturally.

12. Do not repeat yourself unnecessarily.

13. Never claim that an appointment is confirmed unless the system
explicitly tells you that it has been confirmed by a human.

${leadContext}

${policyContext}

Conversation history:

${conversationHistory}

The customer's latest message is:

${state.newMessage}

Respond naturally to the customer's latest message.
`;

  /*
   * Ask the model for the response
   */
  const response = await model.invoke([
    new SystemMessage(systemPrompt),
  ]);

  /*
   * Normalize the model response
   */
  const content =
    typeof response.content === "string"
      ? response.content.trim()
      : JSON.stringify(response.content);

  /*
   * Safety fallback in case the model returns nothing.
   */
  if (!content) {
    return {
      messages: [
        new AIMessage(
          "I'm here to help. What can we help you with?",
        ),
      ],
      action: "CONTINUE",
    };
  }

  return {
    messages: [new AIMessage(content)],
    action: "CONTINUE",
    conversationStatus: "AI_ACTIVE",
  };
}
