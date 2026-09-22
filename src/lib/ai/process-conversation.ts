import { eq, asc } from "drizzle-orm";

import { db } from "@/db";

import { messages } from "@/db/schema/message";
import { leads } from "@/db/schema/lead";
import { conversations } from "@/db/schema/conversation";
import { customers } from "@/db/schema/customer";

import { agent } from "./agent";
import { extractLeadInformation } from "./lead-extraction";

export async function processConversation(
  conversationId: string
) {
  // --------------------------------------------------
  // 1. Get conversation
  // --------------------------------------------------

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      eq(
        conversations.id,
        conversationId
      )
    )
    .limit(1);

  if (!conversation) {
    throw new Error(
      "Conversation not found"
    );
  }

  // --------------------------------------------------
  // 2. Get lead
  // --------------------------------------------------

  const [lead] = await db
    .select()
    .from(leads)
    .where(
      eq(
        leads.id,
        conversation.leadId
      )
    )
    .limit(1);

  if (!lead) {
    throw new Error(
      "Lead not found"
    );
  }

  // --------------------------------------------------
  // 3. Get customer
  // --------------------------------------------------

  const [customer] = await db
    .select()
    .from(customers)
    .where(
      eq(
        customers.id,
        conversation.customerId
      )
    )
    .limit(1);

  // --------------------------------------------------
  // 4. Get conversation history
  // --------------------------------------------------

  const conversationMessages =
    await db
      .select()
      .from(messages)
      .where(
        eq(
          messages.conversationId,
          conversationId
        )
      )
      .orderBy(
        asc(messages.createdAt)
      );

  // --------------------------------------------------
  // 5. Convert DB messages to LangChain messages
  // --------------------------------------------------

  const agentMessages =
    conversationMessages.map(
      (message) => ({
        role:
          message.senderType ===
          "CUSTOMER"
            ? "user"
            : message.senderType ===
              "AI"
            ? "assistant"
            : "user",

        content: message.content,
      })
    );

  // --------------------------------------------------
  // 6. Build lead context
  //
  // This gives the AI information that came from
  // the lead form/database.
  // --------------------------------------------------

  const leadContext = `
Known customer information:

Customer name:
${customer?.name ?? "Not provided"}

Service selected:
${lead.service ?? "Not provided"}

Problem already described:
${lead.problem ?? "Not provided"}

Property type:
${lead.propertyType ?? "Not provided"}

Address:
${lead.address ?? "Not provided"}

City:
${lead.city ?? "Not provided"}

State:
${lead.state ?? "Not provided"}

ZIP code:
${lead.zipCode ?? "Not provided"}

Preferred time:
${lead.preferredTime ?? "Not provided"}

Use this information when responding to the customer.

Do not ask the customer for information that is already known.

If this is the customer's first message after submitting the lead
form, acknowledge the service and problem they already provided,
then ask a useful follow-up question to understand the problem
in more detail.
`;

  // --------------------------------------------------
  // 7. Add lead context to the conversation
  // --------------------------------------------------

  const messagesWithContext = [
    {
      role: "system" as const,
      content: leadContext,
    },

    ...agentMessages,
  ];

  // --------------------------------------------------
  // 8. Run conversational AI
  //
  // Gemini is primary.
  // Mistral is fallback.
  // --------------------------------------------------

  let result;

  try {
    result = await agent.invoke(
      {
        messages:
          messagesWithContext,
      },
      {
        configurable: {
          thread_id:
            conversationId,
        },
      }
    );
  } catch (error) {
    console.error(
      "❌ ALL CHAT MODELS FAILED:",
      error
    );

    const aiError = new Error(
      "AI_MODELS_FAILED"
    );

    aiError.cause = error;

    throw aiError;
  }

  // --------------------------------------------------
  // 9. Get AI response
  // --------------------------------------------------

  const lastMessage =
    result.messages[
      result.messages.length - 1
    ];

  const aiContent =
    typeof lastMessage.content ===
    "string"
      ? lastMessage.content
      : JSON.stringify(
          lastMessage.content
        );

  // --------------------------------------------------
  // 10. Save AI response
  // --------------------------------------------------

  const [aiMessage] =
    await db
      .insert(messages)
      .values({
        conversationId,
        senderType: "AI",
        content: aiContent,
      })
      .returning();

  // --------------------------------------------------
  // 11. Build conversation text
  //
  // Used by the extraction model.
  // --------------------------------------------------

  const updatedMessages = [
    ...conversationMessages,
    aiMessage,
  ];

  const conversationText =
    updatedMessages
      .map((message) => {
        const speaker =
          message.senderType ===
          "CUSTOMER"
            ? "CUSTOMER"
            : message.senderType ===
              "AI"
            ? "AI"
            : "HUMAN";

        return `${speaker}: ${message.content}`;
      })
      .join("\n");

  // --------------------------------------------------
  // 12. Extract lead information
  //
  // Extraction failure must NOT destroy the AI response.
  // --------------------------------------------------

  try {
    const extracted =
      await extractLeadInformation(
        conversationText
      );

    console.log(
      "📋 EXTRACTED LEAD INFORMATION:",
      extracted
    );

    // ------------------------------------------------
    // 13. Merge existing + newly extracted data
    // ------------------------------------------------

    const updatedLead = {
      service:
        extracted.service ??
        lead.service,

      problem:
        extracted.problem ??
        lead.problem,

      urgency:
        extracted.urgency ??
        lead.urgency,

      propertyType:
        extracted.propertyType ??
        lead.propertyType,

      address:
        extracted.address ??
        lead.address,

      city:
        extracted.city ??
        lead.city,

      state:
        extracted.state ??
        lead.state,

      zipCode:
        extracted.zipCode ??
        lead.zipCode,

      preferredTime:
        extracted.preferredTime ??
        lead.preferredTime,
    };

    // ------------------------------------------------
    // 14. Update lead
    // ------------------------------------------------

    await db
      .update(leads)
      .set({
        ...updatedLead,
        updatedAt: new Date(),
      })
      .where(
        eq(
          leads.id,
          conversation.leadId
        )
      );

    console.log(
      "📋 UPDATED LEAD:",
      updatedLead
    );
  } catch (error) {
    console.error(
      "⚠️ LEAD EXTRACTION FAILED:",
      error
    );

    console.log(
      "The AI response was saved successfully."
    );
  }

  // --------------------------------------------------
  // 15. Return AI message
  // --------------------------------------------------

  return aiMessage;
}