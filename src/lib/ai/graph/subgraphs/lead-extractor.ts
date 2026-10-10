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
You extract lead information from an HVAC customer conversation.

Extract information only when it is supported by the conversation.

Do not guess or invent information.

If information is not available, return null.

For service, use simple HVAC categories such as:
- AC Repair
- Heating Repair
- AC Installation
- Heating Installation
- Maintenance
- Other

For urgency:
LOW = routine/non-urgent
MEDIUM = customer needs service soon
HIGH = emergency or major loss of heating/cooling

For property type:
RESIDENTIAL = home, house, apartment
COMMERCIAL = business, office, restaurant, store, etc.

The existing lead data is provided below.

If the conversation contains new information, return the updated value.

If existing lead information is still correct and the conversation does not change it,
keep the existing value.

Return only information supported by the conversation.

Existing lead:
${JSON.stringify(state.currentLead)}
      `,
    },
    {
      role: "user",
      content: state.conversation,
    },
  ]);

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
      return `${message._getType()}: ${message.content}`;
    })
    .join("\n");

  const result = await leadExtractorGraph.invoke({
    conversation,
    currentLead: state.lead,
    extractedLead: null,
  });

  return result.extractedLead!;
}