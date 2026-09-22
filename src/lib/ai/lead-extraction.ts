import { ChatGoogleGenerativeAI } from "@langchain/google-genai";


import { z } from "zod";

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

const extractor = new ChatGoogleGenerativeAI({
  model: "gemini-3.6-flash",
  temperature: 0.7,
  maxRetries: 1, // Keep low so it fails quickly to fallback on rate limits
});


const structuredExtractor = extractor.withStructuredOutput(
        extractionSchema
    );

export async function extractLeadInformation(
    conversation: string
) {
    const result =
        await structuredExtractor.invoke([
            {
                role: "system",
                content:

                    `You extract lead information from an HVAC customer conversation.

                    Extract information only when it is supported
                    by the conversation.

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

                    Return only information that is actually present.`,
            },
            {
                role: "user",
                content: conversation,
            },
        ]);

    return result;
}
