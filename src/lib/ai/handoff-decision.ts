import { ChatOpenRouter } from "@langchain/openrouter";
import { ChatGoogle } from "@langchain/google";
import { createAgent, modelFallbackMiddleware } from "langchain";
import { z } from "zod";

/*
 * ============================================================
 * HANDOFF DECISION SCHEMA
 * ============================================================
 */

const handoffSchema = z.object({
  decision: z
    .enum(["CONTINUE", "HANDOFF"])
    .describe(
      "Whether the AI should continue talking to the customer or hand the conversation to a human."
    ),

  reason: z
    .string()
    .describe(
      "Short explanation for the handoff decision."
    ),
});

/*
 * ============================================================
 * MODELS
 * ============================================================
 */

const primaryModel =
  new ChatGoogle({
    model: "gemini-3.6-flash",
    temperature: 0,
    maxRetries: 1,
  });

const fallbackModel =
  new ChatOpenRouter({
    model: "mistralai/mistral-nemo",
    temperature: 0,
    maxRetries: 2,
  });

/*
 * ============================================================
 * HANDOFF AGENT
 * ============================================================
 */

const handoffAgent =
  createAgent({
    model: primaryModel,

    middleware: [
      modelFallbackMiddleware(
        fallbackModel
      ),
    ],

    responseFormat:
      handoffSchema,
  });

/*
 * ============================================================
 * DECIDE HANDOFF
 * ============================================================
 */

export async function decideHandoff(
  conversation: string
) {
  const result =
    await handoffAgent.invoke({
      messages: [
        {
          role: "system",

          content: `
You are an HVAC lead handoff decision system.

Your job is NOT to talk to the customer.

Your only job is to decide whether the AI should:

CONTINUE
or
HANDOFF

The AI should CONTINUE when it still needs important
information from the customer.

The AI should HANDOFF when enough useful information
has been collected for a human HVAC employee to take
over the conversation.

Important information includes:

- HVAC service needed
- Customer's problem
- How serious/urgent the problem is
- Property type
- Service address
- City
- State
- ZIP/postal code
- Preferred service time

Rules:

1. Do NOT invent missing information.

2. If the customer has only provided a general request,
   normally choose CONTINUE.

3. If the customer has described the problem but important
   information is still missing, choose CONTINUE.

4. Once the conversation contains enough information for
   a human to understand the job and contact/continue with
   the customer, choose HANDOFF.

5. Do not require every field to be filled if the missing
   field is not necessary to understand the request.

6. Emergency situations should generally be handed to a
   human quickly.

7. Do not provide a customer-facing response.

Return only the structured decision.
`,
        },

        {
          role: "user",

          content: conversation,
        },
      ],
    });

  return result;
}
