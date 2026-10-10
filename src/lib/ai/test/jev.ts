
import type { AITestStateType, TestBookingReadiness } from "./state";

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
  bookingReadiness: TestBookingReadiness;
};

export async function testJev(
  state: AITestStateType,
): Promise<Partial<AITestStateType>> {
  const apiKey = process.env.TYPESAFE_API_KEY;

  if (!apiKey) {
    throw new Error("TYPESAFE_API_KEY is not configured");
  }

  const lead = state.lead;

  const conversation = state.messages.slice(0, -1).map((message) => {
    const role =
      message._getType() === "human" ? "Customer" : "Assistant";

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
            instructions: {
              question:
                "Is the latest customer message spam or abusive content?",
              inspect: "latestMessage, conversation",
              focus:
                "Look for unsolicited promotional content, scams, malicious links, or abuse. Do not confuse repetition, emojis, short messages, or low intent with spam.",
            },
            criteria: {
              true: {
                what:
                  "The message is clearly unsolicited promotional spam, a scam, malicious solicitation, or abusive content.",
                examples: [
                  "Buy our marketing services! Visit our website for a discount.",
                  "Repeated unsolicited advertisements unrelated to HVAC service.",
                  "Unsolicited scam messages containing suspicious links.",
                ],
              },
              false: {
                what:
                  "The message is a legitimate customer communication or there is insufficient evidence of spam.",
                examples: [
                  "Hi",
                  "My AC isn't cooling.",
                  "How much does AC repair cost?",
                  "Hi 😊",
                  "A repeated question about an HVAC service.",
                ],
              },
            },
          },

          isMeaningfulResponse: {
            type: "noul",
            instructions: {
              question:
                "Does the latest customer message meaningfully advance the conversation?",
              inspect: "latestMessage, conversation",
              focus:
                "Judge the message in context. Greetings can start a conversation, short answers can answer a question, and customers who are not ready to book can still contribute meaningfully.",
            },
            criteria: {
              true: {
                what:
                  "The message starts a conversation, answers a relevant question, asks a genuine question, describes a service need, provides useful details, or otherwise advances the conversation.",
                examples: [
                  "The first hi in a new conversation.",
                  "My AC isn't cooling.",
                  "Yes, tomorrow works for me.",
                  "How much does a diagnostic visit cost?",
                  "I'm comparing prices before I decide.",
                  "I'm not ready to book yet.",
                ],
              },
              false: {
                what:
                  "The message adds no useful information and does not answer a relevant question or move the conversation forward.",
                examples: [
                  "Hi repeated after the assistant has already greeted the customer.",
                  "Okay, when it does not answer the previous question.",
                  "Hmm, without useful context.",
                  "Repeated greetings with no new information.",
                ],
              },
            },
          },

          shouldExtract: {
            type: "noul",
            instructions: {
              question:
                "Does the latest customer message explicitly provide new or changed information for the structured HVAC lead?",
              inspect: "latestMessage, conversation, lead",
              focus:
                "Extract only information actually provided by the customer. Consider what is already stored in the lead.",
            },
            criteria: {
              true: {
                what:
                  "The customer explicitly provides or corrects the service, problem, urgency, property type, address, city, state, ZIP code, or preferred appointment time.",
                examples: [
                  "My AC is making a loud buzzing noise.",
                  "It's a commercial property.",
                  "I'm in Dallas, Texas.",
                  "Tomorrow after 3 PM works.",
                ],
              },
              false: {
                what:
                  "The customer provides no new or changed lead information.",
                examples: [
                  "Hi",
                  "Okay",
                  "I'm comparing prices.",
                  "Can you explain your diagnostic fee?",
                ],
              },
            },
          },

          shouldHandoff: {
            type: "noul",
            instructions: {
              question:
                "Does the latest customer message or conversation context require human involvement now?",
              inspect: "latestMessage, conversation, lead",
              focus:
                "Look for an explicit request for a human, a required human verification step, or a situation requiring human judgment. Do not confuse low intent, repeated greetings, or not being ready to book with a need for human involvement.",
            },
            criteria: {
              true: {
                what:
                  "The customer explicitly requests a human, an appointment requires human verification before booking, or the situation requires human intervention.",
                examples: [
                  "Can I speak to a real person?",
                  "Please connect me with your team.",
                  "The customer has requested an appointment that requires human verification before booking.",
                  "A serious safety situation requires human intervention.",
                ],
              },
              false: {
                what:
                  "Human involvement is not specifically required at this point.",
                examples: [
                  "Hi",
                  "Hi repeated after the assistant has greeted the customer.",
                  "My AC is not cooling.",
                  "I'm not ready to book yet.",
                  "How much does AC repair cost?",
                ],
              },
            },
          },

          isAppointmentRequest: {
            type: "noul",
            instructions: {
              question:
                "Is the customer requesting or discussing scheduling an HVAC service appointment?",
              inspect: "latestMessage, conversation",
              focus:
                "Distinguish actual scheduling intent from general interest, price questions, and statements that the customer is not ready to book.",
            },
            criteria: {
              true: {
                what:
                  "The customer asks to schedule service, requests an appointment, or provides a date or time in a scheduling context.",
                examples: [
                  "Can you send a technician tomorrow?",
                  "I'd like to book an appointment.",
                  "Can someone come Friday afternoon?",
                ],
              },
              false: {
                what:
                  "The customer is not requesting or discussing a specific appointment.",
                examples: [
                  "How much does AC repair cost?",
                  "I'm comparing prices.",
                  "I'm not ready to book yet.",
                  "My AC isn't cooling.",
                ],
              },
            },
          },

          isEmergency: {
            type: "noul",
            instructions: {
              question:
                "Does the customer describe an immediate or potentially serious safety emergency involving HVAC equipment or the surrounding area?",
              inspect: "latestMessage, conversation",
              focus:
                "Look for concrete safety hazards, not ordinary equipment problems or routine repair requests.",
            },
            criteria: {
              true: {
                what:
                  "The customer describes a possible immediate safety hazard.",
                examples: [
                  "I smell gas near the furnace.",
                  "There is smoke coming from the HVAC unit.",
                  "I suspect carbon monoxide is leaking.",
                  "There are sparks coming from the equipment.",
                ],
              },
              false: {
                what:
                  "No immediate or potentially serious safety emergency is indicated.",
                examples: [
                  "My AC isn't cooling.",
                  "The unit is making a loud noise.",
                  "I need routine maintenance.",
                ],
              },
            },
          },

          isBookingReady: {
            type: "noul",
            instructions: {
              question:
                "Has the customer clearly indicated that they are ready to schedule an appointment now?",
              inspect: "latestMessage, conversation, lead",
              focus:
                "Look for explicit present booking intent. A service request, price question, or willingness to receive information alone does not establish booking readiness.",
            },
            criteria: {
              true: {
                what:
                  "The customer explicitly agrees to schedule, asks to book now, or confirms that they want to proceed with an appointment.",
                examples: [
                  "I'd like to book an appointment.",
                  "Please schedule a technician for tomorrow.",
                  "Yes, let's get it scheduled.",
                  "I'm ready to book the service.",
                ],
              },
              false: {
                what:
                  "The customer has not clearly indicated readiness to schedule right now.",
                examples: [
                  "I'm just comparing prices.",
                  "I'm not ready to book yet.",
                  "Maybe next month.",
                  "How much does a diagnostic visit cost?",
                  "My AC isn't cooling.",
                  "The customer has not discussed booking.",
                ],
              },
            },
          },

          isExplicitlyNotReadyToBook: {
            type: "noul",
            instructions: {
              question:
                "Has the customer explicitly indicated that they are not ready or do not want to schedule an appointment yet?",
              inspect: "latestMessage, conversation",
              focus:
                "Look for an expressed delay or hesitation about booking. Do not infer reluctance simply because the customer has not mentioned scheduling.",
            },
            criteria: {
              true: {
                what:
                  "The customer explicitly says they want to wait, are only researching, need to think about it, or are not ready to schedule yet.",
                examples: [
                  "I'm just comparing prices for now.",
                  "I'm not ready to book yet.",
                  "I need to think about it.",
                  "Maybe next month.",
                  "I need to discuss it with my family first.",
                ],
              },
              false: {
                what:
                  "The customer has not explicitly said they are not ready to book.",
                examples: [
                  "I'd like to book for tomorrow.",
                  "How much does a diagnostic visit cost?",
                  "My AC isn't cooling.",
                  "Hi",
                  "The customer has not discussed booking readiness.",
                ],
              },
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
    "isBookingReady",
    "isExplicitlyNotReadyToBook",
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

  const isBookingReady = answers.isBookingReady.noul > 0.5;
  const isExplicitlyNotReady =
    answers.isExplicitlyNotReadyToBook.noul > 0.5;

  // If the two signals conflict, avoid making an unsupported assumption.
  const bookingReadiness: TestBookingReadiness =
    isBookingReady && !isExplicitlyNotReady
      ? "READY"
      : isExplicitlyNotReady && !isBookingReady
        ? "NOT_READY"
        : "UNKNOWN";

  const jevDecision: TestJevDecision = {
    isSpam: answers.isSpam.noul > 0.5,
    isMeaningfulResponse:
      answers.isMeaningfulResponse.noul > 0.5,
    shouldExtract: answers.shouldExtract.noul > 0.5,
    shouldHandoff: answers.shouldHandoff.noul > 0.5,
    isAppointmentRequest:
      answers.isAppointmentRequest.noul > 0.5,
    isEmergency: answers.isEmergency.noul > 0.5,
    bookingReadiness,
  };

  return {
    jevDecision,
    bookingReadiness,
  };
}
