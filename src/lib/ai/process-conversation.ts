
import { eq } from "drizzle-orm";

import { db } from "@/db";

import { messages } from "@/db/schema/message";
import { conversations } from "@/db/schema/conversation";

import { hvacGraph } from "./graph/graph";

export async function processConversation(
  conversationId: string,
  newMessage: string
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

  // Human has taken over / is expected to respond.
  if (conversation.status === "WAITING_FOR_HUMAN") {
    console.log(
      "👤 Conversation is waiting for human. Skipping AI."
    );

    return null;
  }

  // --------------------------------------------------
  // 2. Run LangGraph
  // --------------------------------------------------

  let result;

  try {
    result = await hvacGraph.invoke({
      conversationId,

      customerId: "",
      leadId: "",

      newMessage,

      messages: [],
      lead: null,

      action: null,
      handoffReason: null,
      pendingTool: null,
      toolResult: null,
    });
  } catch (error) {
    console.error(
      "❌ LangGraph failed:",
      error
    );

    const aiError = new Error(
      "AI_GRAPH_FAILED"
    );

    aiError.cause = error;

    throw aiError;
  }

  // --------------------------------------------------
  // 3. Suppress spam responses
  // --------------------------------------------------

  // Emergency handling always takes priority.
  // Do not save an AI response for spam unless the
  // message was also classified as an emergency.
  if (
    result.jevDecision?.isSpam === true &&
    result.jevDecision.isEmergency !== true
  ) {
    console.log(
      "🚫 Spam detected. Skipping AI response save:",
      conversationId
    );

    return null;
  }

  // --------------------------------------------------
  // 4. Determine customer-facing response
  // --------------------------------------------------

  let aiContent: string;

  if (result.action === "HANDOFF") {
    aiContent =
      "Thanks! I've got your request. I'll have someone from our team review the details and confirm the appointment with you shortly.";
  } else {
    const lastMessage =
      result.messages[
        result.messages.length - 1
      ];

    if (!lastMessage) {
      throw new Error(
        "LangGraph returned no response message"
      );
    }

    aiContent =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(
            lastMessage.content
          );
  }

  // --------------------------------------------------
  // 5. Save AI response
  // --------------------------------------------------

  const [aiMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      senderType: "AI",
      content: aiContent,
    })
    .returning();

  if (!aiMessage) {
    throw new Error(
      "Failed to save AI response"
    );
  }

  console.log(
    "💬 AI response saved:",
    aiMessage.id
  );

  // --------------------------------------------------
  // 6. Return AI message
  // --------------------------------------------------

  return aiMessage;
}
