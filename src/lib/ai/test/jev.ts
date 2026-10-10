
import type { AITestStateType } from "./state";

type TestJevInput = {
  latestMessage: string;
  lead: {
    service: string | null;
    problem: string | null;
    urgency: "LOW" | "MEDIUM" | "HIGH" | null;
    propertyType: "RESIDENTIAL" | "COMMERCIAL" | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    preferredTime: string | null;
  };
  conversation: string[];
};

type TestJevDecision = {
  isMeaningfulResponse: boolean;
  shouldExtract: boolean;
  shouldHandoff: boolean;
  isAppointmentRequest: boolean;
  isEmergency: boolean;
  isSpam: boolean;
};

export async function testJev(
  state: AITestStateType,
): Promise<Partial<AITestStateType>> {
  const apiKey = process.env.TYPESAFE_API_KEY;

  if (!apiKey) {
    throw new Error("TYPESAFE_API_KEY is not configured");
  }

  const lead = state.lead;

  const conversation = state.messages
    .slice(0, -1)
    .map((message) => {
      const role =
        message._getType() === "human"
          ? "Customer"
          : "Assistant";

      const content =
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content);

      return `${role}: ${content}`;
    });

  const input: TestJevInput = {
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
  };

  const response = await fetch(
    "https://api.typesafe.ai/v1/systemone",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "jev-latest",
        state: input,
        questions: {
          isSpam: {
            type: "noul",
            instructions: `
Determine whether the customer's latest message is spam
or abusive content, using the conversation for context.

Classify the message itself, not merely whether it is repetitive,
unclear, short, or unrelated to HVAC.
`,
            criteria: {
              true: `
The message is clearly unsolicited promotional content,
bulk advertising, repeated solicitation, malicious links,
scams, or abusive content that is unrelated to legitimate
customer support.

Examples:
- Repeated unsolicited advertisements for unrelated products.
- Unsolicited promotions containing suspicious links.
- Repeated commercial solicitation unrelated to HVAC service.

Require evidence of spam or abuse. Do not assume spam
from a short or unusual message.
`,
              false: `
The message is a legitimate customer communication,
including greetings, questions, HVAC requests, unclear messages,
repeated greetings, short acknowledgements, frustration,
or an emergency report.

A repeated "hi" may indicate low conversational intent,
but is not spam by itself.

Do not classify a message as spam just because it is irrelevant,
misspelled, repetitive, or difficult to understand.
`,
            },
          },

          isMeaningfulResponse: {
            type: "noul",
            instructions: `
Determine whether the latest customer message meaningfully
advances the conversation, considering the conversation history.

Meaningful means the message starts a conversation, answers
a question, asks a relevant question, expresses a service need,
provides useful information, or otherwise gives the assistant
something relevant to respond to.

A greeting can start a conversation. However, a greeting repeated
after the assistant has already acknowledged the greeting,
without adding anything new, does not meaningfully advance it.

Use the previous messages to distinguish a first greeting
from a repeated greeting.
`,
            criteria: {
              true: `
Examples:
- The first "hi" in a new conversation.
- "My AC isn't cooling."
- "I need heating repair."
- "How much does a diagnostic visit cost?"
- "Yes" when answering a relevant yes/no question.
- "Tomorrow at 5" when answering a scheduling question.
- A greeting followed by a genuine service question.

Judge short replies in context. A short answer can be meaningful
when it answers the assistant's previous question.
`,
              false: `
Examples:
- "Hi" repeated after the assistant has already greeted
  the customer and the customer adds no new information.
- "Okay" when it does not answer the previous question.
- "Hmm" without any useful context.
- An acknowledgement that does not answer a question
  or move the conversation forward.

Do not mark a legitimate HVAC request as meaningless
just because it is short or contains spelling mistakes.
`,
            },
          },

          shouldExtract: {
            type: "noul",
            instructions: `
Does the latest message explicitly provide new or changed
information that belongs in the structured HVAC lead?
`,
            criteria: {
              true: `
The message explicitly provides or corrects a service,
problem, urgency, property type, address, city, state,
ZIP code, or preferred appointment time.
`,
              false: `
No new or changed lead information is explicitly provided.
Do not infer missing details.
`,
            },
          },

          shouldHandoff: {
            type: "noul",
            instructions: {
              question: "Does the latest customer message or conversation context require human involvement now?",
              inspect: "latestMessage, conversation, lead",
              focus: "Look for an explicit request for a human, a required human verification step, or a situation requiring human judgment. Do not confuse low intent or repeated messages with a need for human involvement."
            },
            criteria: {
              true: {
                what: "The customer explicitly requests a human representative, an appointment requires human verification before booking, or the situation requires human intervention.",
                examples: [
                  "Can I speak to a real person?",
                  "Please connect me with your team.",
                  "The customer has requested an appointment that must be verified by a human before booking.",
                  "The customer reports a serious safety emergency requiring human intervention."
                ]
              },
              false: {
                what: "The message does not require human involvement, even if it is repetitive, unclear, short, or low intent.",
                examples: [
                  "hi",
                  "hi (after the assistant has already greeted the customer)",
                  "ok",
                  "hmm",
                  "My AC is not cooling.",
                  "How much does AC repair cost?"
                ]
              }
            }
          },

          isAppointmentRequest: {
            type: "noul",
            instructions: `
Is the customer requesting, discussing, or providing information
for an appointment or service scheduling?
`,
            criteria: {
              true: `
The customer requests a booking, asks to schedule service,
or gives a date or time in a scheduling context.
`,
              false: `
The customer is not requesting or discussing scheduling.
`,
            },
          },

          isEmergency: {
            type: "noul",
            instructions: `
Does the customer describe an immediate or potentially serious
safety emergency involving HVAC equipment or the surrounding area?
`,
            criteria: {
              true: `
Examples include fire, smoke, suspected carbon monoxide,
gas smell, or immediate electrical danger.
`,
              false: `
No immediate or potentially serious safety emergency is indicated.
`,
            },
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Test Lab Jev API failed (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();

  if (!data?.answers) {
    throw new Error("Test Lab Jev returned an invalid response");
  }

  const answers = data.answers;

  const requiredQuestions = [
    "isSpam",
    "isMeaningfulResponse",
    "shouldExtract",
    "shouldHandoff",
    "isAppointmentRequest",
    "isEmergency",
  ] as const;

  for (const question of requiredQuestions) {
    if (
      typeof answers[question]?.noul !== "number" ||
      !Number.isFinite(answers[question].noul)
    ) {
      throw new Error(
        `Test Lab Jev returned an invalid answer: ${question}`,
      );
    }
  }

  const jevDecision: TestJevDecision = {
    isSpam: answers.isSpam.noul > 0.5,
    isMeaningfulResponse:
      answers.isMeaningfulResponse.noul > 0.5,
    shouldExtract: answers.shouldExtract.noul > 0.5,
    shouldHandoff: answers.shouldHandoff.noul > 0.5,
    isAppointmentRequest:
      answers.isAppointmentRequest.noul > 0.5,
    isEmergency: answers.isEmergency.noul > 0.5,
  };

  return { jevDecision };
}
