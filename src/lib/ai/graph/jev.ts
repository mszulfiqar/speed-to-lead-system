type JevInput = {
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

export type JevDecision = {
  isMeaningfulResponse: boolean;
  shouldExtract: boolean;
  shouldHandoff: boolean;
  isAppointmentRequest: boolean;
  isEmergency: boolean;
};

export async function runJev(
  input: JevInput
): Promise<JevDecision> {
  const apiKey = process.env.TYPESAFE_API_KEY;

  if (!apiKey) {
    throw new Error("SYSTEM_ONE_API_KEY is not configured");
  }

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

        state: {
          latestMessage: input.latestMessage,
          lead: input.lead,
          conversation: input.conversation,
        },

        questions: {
          /*
           * ======================================================
           * MEANINGFUL RESPONSE
           * ======================================================
           *
           * This is the most important decision for our current
           * Test Lab problem.
           */
          isMeaningfulResponse: {
            type: "noul",

            instructions: `
Determine whether the customer's latest message is meaningful
in the context of the conversation.

Meaningful does NOT require the customer to provide lead information.

A message is meaningful if it:
- starts a conversation,
- is a greeting,
- answers the previous question,
- asks a relevant question,
- states an intent,
- describes a problem,
- provides a relevant detail,
- provides a date or time,
- or otherwise gives the AI enough meaning to continue naturally.

A message is NOT meaningful when it is only a vague acknowledgement
or contains no useful conversational meaning.
`,

            criteria: {
              true: `
Examples:

"hi"
"hello"
"hey"
"I need AC repair"
"My AC isn't cooling"
"I want to book an appointment"
"tomorrow at 5"
"Is there someone available today?"

A greeting at the beginning of a conversation is meaningful
because it starts the conversation.
`,

              false: `
Examples:

"ok"
"okay"
"oky"
"hmm"
"fine"
"alright"

These should be false when they do not answer the previous question
or provide useful information.

Do not mark a greeting such as "hi", "hello", or "hey" as false.
`,
            },
          },

          /*
           * ======================================================
           * LEAD EXTRACTION
           * ======================================================
           */
          shouldExtract: {
            type: "noul",

            instructions:
              "Does the latest customer message contain explicit new or changed information that should be added or updated in the structured lead data?",

            criteria: {
              true:
                "The customer explicitly provides new or changed lead information such as service, problem, urgency, property type, address, city, state, ZIP code, or preferred time.",

              false:
                "The customer does not provide explicit new or changed lead information. Never infer missing information.",
            },
          },

          /*
           * ======================================================
           * HUMAN HANDOFF
           * ======================================================
           */
          shouldHandoff: {
            type: "noul",

            instructions:
              "Does the conversation currently require human involvement?",

            criteria: {
              true:
                "A human should become involved now, such as when human verification is required, the customer explicitly asks for a human, or the situation cannot safely or appropriately be handled by the AI.",

              false:
                "The AI can continue handling the conversation.",
            },
          },

          /*
           * ======================================================
           * APPOINTMENT
           * ======================================================
           */
          isAppointmentRequest: {
            type: "noul",

            instructions:
              "Is the customer currently requesting an appointment, booking, scheduling, or providing a date or time in the context of scheduling?",

            criteria: {
              true:
                "The customer explicitly requests an appointment, asks to book/schedule service, or provides a date/time clearly related to scheduling.",

              false:
                "The customer is not requesting or discussing appointment scheduling.",
            },
          },

          /*
           * ======================================================
           * EMERGENCY
           * ======================================================
           */
          isEmergency: {
            type: "noul",

            instructions:
              "Does the customer describe an immediate safety emergency such as fire, smoke, gas smell, electrical danger, carbon monoxide concern, or another dangerous situation?",

            criteria: {
              true:
                "There is an immediate or potentially serious safety emergency.",

              false:
                "There is no immediate safety emergency.",
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Jev API failed (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();

  /*
   * Basic response validation.
   *
   * This prevents confusing undefined/null values from silently
   * entering the graph if the API response changes.
   */
  if (!data?.answers) {
    throw new Error(
      "Jev API returned an invalid response"
    );
  }

  return {
    isMeaningfulResponse:
      data.answers.isMeaningfulResponse?.noul > 0.5,

    shouldExtract:
      data.answers.shouldExtract?.noul > 0.5,

    shouldHandoff:
      data.answers.shouldHandoff?.noul > 0.5,

    isAppointmentRequest:
      data.answers.isAppointmentRequest?.noul > 0.5,

    isEmergency:
      data.answers.isEmergency?.noul > 0.5,
  };
}
