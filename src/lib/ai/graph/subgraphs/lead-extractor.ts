
import { ChatOpenRouter } from "@langchain/openrouter";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { z } from "zod";

import type { HVACStateType } from "../state";

/*
 * Structured lead data
 */
const extractionSchema = z.object({
  service: z
    .string()
    .nullable()
    .describe("The HVAC service the customer needs"),

  problem: z
    .string()
    .nullable()
    .describe("The customer's described HVAC problem"),

  urgency: z
    .enum(["LOW", "MEDIUM", "HIGH"])
    .nullable()
    .describe("Urgency of the HVAC problem"),

  propertyType: z
    .enum(["RESIDENTIAL", "COMMERCIAL"])
    .nullable()
    .describe("Whether the property is residential or commercial"),

  address: z
    .string()
    .nullable()
    .describe("The service address"),

  city: z
    .string()
    .nullable()
    .describe("The city where service is needed"),

  state: z
    .string()
    .nullable()
    .describe("The state where service is needed"),

  zipCode: z
    .string()
    .nullable()
    .describe("The ZIP/postal code"),

  preferredTime: z
    .string()
    .nullable()
    .describe("The customer's preferred service time"),
});

type ExtractedLead = z.infer<typeof extractionSchema>;

/*
 * Extractor state
 */
const ExtractorState = Annotation.Root({
  conversation: Annotation<string>(),
  currentLead: Annotation<HVACStateType["lead"]>(),
  extractedLead: Annotation<ExtractedLead | null>(),
});

/*
 * Extractor model
 */
const extractorModel = new ChatOpenRouter({
  model: "mistralai/mistral-nemo",
  temperature: 0,
  maxRetries: 1,
}).withStructuredOutput(extractionSchema);

/*
 * Extraction node
 */
async function extractNode(
  state: typeof ExtractorState.State
): Promise<Partial<typeof ExtractorState.State>> {
  const response = await extractorModel.invoke([
    {
      role: "system",
      content: `
You extract accurate, up-to-date lead information from an HVAC
customer conversation.

Your task is to return the LATEST CORRECT information for every field.

IMPORTANT RULES:

1. READ THE ENTIRE CONVERSATION.
   Do not consider only the latest message. Earlier messages provide context.

2. CUSTOMER CORRECTIONS TAKE PRIORITY.
   If the customer explicitly corrects previously provided information,
   return the corrected value instead of the old value.

   Examples:
   - "My address is 123 Main Street."
   - "Sorry, I meant 456 Oak Street."
   Result: address = "456 Oak Street"

   - "It's a commercial property."
   - "Actually, it's my house."
   Result: propertyType = "RESIDENTIAL"

   - "Please come tomorrow."
   - "Actually, today would be better."
   Result: preferredTime = "today"

3. USE THE MOST RECENT CLEAR ANSWER.
   When the customer gives conflicting answers for the same field,
   use their latest clear correction.

4. PRESERVE INFORMATION THAT HAS NOT CHANGED.
   If a field has already been provided and the conversation does not
   contradict or correct it, keep the existing value.

5. HANDLE ADDITIONAL INFORMATION WITHOUT LOSING OLD DETAILS.
   If the customer adds another symptom, preserve the relevant existing
   problem details and include the new information in the problem field.

   Example:
   - Existing: "AC is blowing warm air."
   - New: "It is also making a loud buzzing noise."
   Result: include both warm air and buzzing noise.

6. DO NOT TREAT EVERY NEW MESSAGE AS A CORRECTION.
   A message such as "okay", "thanks", or "yes" does not replace
   existing information unless its meaning clearly answers a question.

7. DO NOT GUESS.
   If a field has no supported value in either the conversation or
   existing lead, return null.
   Never invent an address, location, urgency, or appointment time.

8. USE EXISTING DATA AS CONTEXT, NOT AS AN OVERRIDE.
   Existing lead values are not automatically more reliable than a
   clear correction from the customer.

9. KEEP FIELDS CONSISTENT.
   Use the corrected value for the relevant field. Do not change
   unrelated fields just because another field was corrected.


10. ONLY THE CUSTOMER CAN ESTABLISH THEIR PREFERENCES.
    Extract preferredTime only from an explicit customer statement
    expressing when they want or are available for a visit.

    Do not use the assistant's suggestions, assumptions, or statements
    as evidence of the customer's preferred time.

    Examples:
    - Assistant: "We can get someone out soon."
      Customer has not stated a preferred time.
      Result: preferredTime = null, unless a previous customer
      statement established a valid preference.

    - Customer: "I need someone today."
      Result: preferredTime = "today"

    - Customer: "As soon as possible, please."
      Result: preferredTime = "ASAP"

11. URGENCY DOES NOT DETERMINE PREFERRED TIME.
    A serious problem does not automatically mean the customer wants
    an ASAP appointment. Keep urgency and preferredTime separate.

FIELD GUIDANCE:

Service categories:
- AC Repair
- Heating Repair
- AC Installation
- Heating Installation
- Maintenance
- Other

Urgency:
- LOW = routine, non-urgent issue
- MEDIUM = needs service soon
- HIGH = serious or urgent heating/cooling problem

Do not automatically classify every loss of cooling as HIGH.
Use the conversation and the actual severity described.

Property type:
- RESIDENTIAL = home, house, apartment
- COMMERCIAL = business, office, restaurant, store, etc.

Return the complete current lead, not just the fields mentioned
in the latest message.

Existing lead:
${JSON.stringify(state.currentLead)}
      `,
    },
    {
      role: "user",
      content: state.conversation,
    },
  ]);

  console.log("📋 Extractor response:", response);

  return {
    extractedLead: response,
  };
}

/*
 * Build extractor subgraph
 */
const extractorWorkflow = new StateGraph(ExtractorState)
  .addNode("extract", extractNode)
  .addEdge(START, "extract")
  .addEdge("extract", END);

export const leadExtractorGraph = extractorWorkflow.compile();

/*
 * Main graph → extractor subgraph
 */
export async function runLeadExtractor(
  state: HVACStateType
): Promise<ExtractedLead> {
  const conversation = state.messages
    .map((message) => {
      const type = message._getType();
      const role =
        type === "human"
          ? "CUSTOMER"
          : type === "ai"
            ? "ASSISTANT"
            : "SYSTEM";

      return `${role}: ${message.content}`;
    })
    .join("\n");

  const result = await leadExtractorGraph.invoke({
    conversation,
    currentLead: state.lead,
    extractedLead: null,
  });

  if (!result.extractedLead) {
    throw new Error("Lead extraction did not return a result");
  }

  return result.extractedLead;
}
