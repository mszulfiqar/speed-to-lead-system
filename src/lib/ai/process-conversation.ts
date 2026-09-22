import { eq, asc } from "drizzle-orm";

import { db } from "@/db";
import { messages } from "@/db/schema/message";
import { leads } from "@/db/schema/lead";
import { conversations } from "@/db/schema/conversation";

import { agent } from "./agent";
import { extractLeadInformation } from "./lead-extraction";

export async function processConversation(
  conversationId: string
) {
  // 1. Get all existing conversation messages
  const conversationMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  // 2. Convert DB messages into LangChain messages
  const agentMessages = conversationMessages.map(
    (message) => ({
      role:
        message.senderType === "CUSTOMER"
          ? "user"
          : message.senderType === "AI"
          ? "assistant"
          : "user",

      content: message.content,
    })
  );

  // 3. Ask the AI to generate a response
  const result = await agent.invoke(
    {
      messages: agentMessages,
    },
    {
      configurable: {
        thread_id: conversationId,
      },
    }
  );

  // 4. Get the latest AI response
  const lastMessage =
    result.messages[result.messages.length - 1];

  const aiContent =
    typeof lastMessage.content === "string"
      ? lastMessage.content
      : JSON.stringify(lastMessage.content);

  // 5. Save the AI response to the database
  const [aiMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      senderType: "AI",
      content: aiContent,
    })
    .returning();

  // 6. Get the lead connected to this conversation
  const [conversation] = await db
    .select({
      leadId: conversations.leadId,
    })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation) {
    throw new Error(
      "Conversation not found"
    );
  }

  // 7. Build the complete conversation
  // for the extraction model
  const updatedMessages = [
    ...conversationMessages,
    aiMessage,
  ];

  const conversationText = updatedMessages
    .map((message) => {
      const speaker =
        message.senderType === "CUSTOMER"
          ? "CUSTOMER"
          : message.senderType === "AI"
          ? "AI"
          : "HUMAN";

      return `${speaker}: ${message.content}`;
    })
    .join("\n");

  // 8. Extract useful lead information
  const extracted =
    await extractLeadInformation(
      conversationText
    );

  console.log(
    "📋 EXTRACTED LEAD INFORMATION:",
    extracted
  );

  // 9. Update the lead with whatever
  // information the AI has learned
  await db
    .update(leads)
    .set({
      service: extracted.service,
      problem: extracted.problem,
      urgency: extracted.urgency,
      propertyType: extracted.propertyType,
      address: extracted.address,
      city: extracted.city,
      state: extracted.state,
      zipCode: extracted.zipCode,
      preferredTime: extracted.preferredTime,
      updatedAt: new Date(),
    })
    .where(
      eq(leads.id, conversation.leadId)
    );

  // 10. Return the AI message
  return aiMessage;
}
