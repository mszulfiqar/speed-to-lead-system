
import { eq } from "drizzle-orm";

import { db } from "@/db";

import { messages } from "@/db/schema/message";
import { conversations } from "@/db/schema/conversation";

import { hvacGraph } from "./graph/graph";

export async function processConversation(
  conversationId: string,
  newMessage: string
) {
  // 1. Get conversation
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Do not respond when a human is already handling the conversation.
  if (conversation.status === "WAITING_FOR_HUMAN") {
    console.log(
      "👤 Conversation is waiting for human. Skipping AI."
    );

    return null;
  }

  // 2. Run LangGraph
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
    console.error("❌ LangGraph failed:", error);

    const aiError = new Error("AI_GRAPH_FAILED");
    aiError.cause = error;

    throw aiError;
  }

  // 3. Handle emergencies before spam suppression.
  // Emergency classification takes priority over spam.
  if (result.jevDecision?.isEmergency === true) {
    console.log(
      "🚨 Emergency detected. Escalating to human:",
      conversationId
    );

    // Mark the conversation for human attention.
    await db
      .update(conversations)
      .set({
        status: "WAITING_FOR_HUMAN",
      })
      .where(eq(conversations.id, conversationId));

    const emergencyContent =
      "A possible gas leak is a serious safety concern. Leave the area immediately and get to a safe location. Do not use flames, operate electrical switches, or start appliances near the suspected leak. Once you are safely away, contact your local gas emergency service or emergency number. Please do not re-enter until emergency responders say it is safe.";

    // Save the safety response.
    const [emergencyMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        senderType: "AI",
        content: emergencyContent,
      })
      .returning();

    if (!emergencyMessage) {
      throw new Error(
        "Failed to save emergency safety response"
      );
    }

    console.log(
      "🚨 Emergency safety response saved:",
      emergencyMessage.id
    );

    return emergencyMessage;
  }

  // 4. Suppress spam responses.
  if (result.jevDecision?.isSpam === true) {
    console.log(
      "🚫 Spam detected. Skipping AI response save:",
      conversationId
    );

    return null;
  }
  
  // 5. Determine the normal customer-facing response.
  let aiContent: string;

  if (result.action === "HANDOFF") {
    aiContent =
      "Thanks! I've got your request. I'll have someone from our team review the details and confirm the appointment with you shortly.";
  } else {
    const lastMessage =
      result.messages[result.messages.length - 1];

    if (!lastMessage) {
      throw new Error(
        "LangGraph returned no response message"
      );
    }

    const content = lastMessage.content;

    if (typeof content === "string") {
      aiContent = content;
    } else if (Array.isArray(content)) {
      aiContent = content
        .filter(
          (block): block is { type: "text"; text: string } =>
            typeof block === "object" &&
            block !== null &&
            "type" in block &&
            block.type === "text" &&
            "text" in block &&
            typeof block.text === "string"
        )
        .map((block) => block.text)
        .join("\n")
        .trim();
    } else {
      throw new Error(
        "AI returned an unsupported response content format"
      );
    }

    if (!aiContent) {
      throw new Error(
        "AI returned no customer-facing text"
      );
    }
  }


  // 6. Save the normal AI response.
  const [aiMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      senderType: "AI",
      content: aiContent,
    })
    .returning();

  if (!aiMessage) {
    throw new Error("Failed to save AI response");
  }

  console.log("💬 AI response saved:", aiMessage.id);

  return aiMessage;
}
