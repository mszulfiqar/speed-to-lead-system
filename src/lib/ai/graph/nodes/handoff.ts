import { eq } from "drizzle-orm";

import { db } from "@/db";
import { conversations } from "@/db/schema/conversation";

import type { HVACStateType } from "../state";

export async function handoffNode(
  state: HVACStateType
): Promise<Partial<HVACStateType>> {
  if (!state.conversationId) {
    console.log("⚠️ No conversation ID available for handoff");

    return {
      action: "HANDOFF",
    };
  }

  await db
    .update(conversations)
    .set({
      status: "WAITING_FOR_HUMAN",
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, state.conversationId));

  console.log(
    "👤 Conversation waiting for human:",
    state.conversationId
  );

  return {
    action: "HANDOFF",
  };
}