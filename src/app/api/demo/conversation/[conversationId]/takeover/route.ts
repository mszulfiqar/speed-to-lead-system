import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";

import { conversations } from "@/db/schema/conversation";
import { leads } from "@/db/schema/lead";

import { getDemoSession } from "@/lib/demo-session";

type Props = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: Props
) {
  try {
    const { conversationId } = await params;

    const body = await request.json();

    const sessionId = body.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      );
    }

    // Verify demo session
    const session = await getDemoSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired demo session" },
        { status: 401 }
      );
    }

    // Find conversation + its lead
    const [conversation] = await db
      .select({
        id: conversations.id,
        status: conversations.status,
        leadId: conversations.leadId,
        demoSessionId: leads.demoSessionId,
      })
      .from(conversations)
      .innerJoin(
        leads,
        eq(conversations.leadId, leads.id)
      )
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Make sure this conversation belongs
    // to the current demo session
    if (conversation.demoSessionId !== session.id) {
      return NextResponse.json(
        { error: "Conversation does not belong to this session" },
        { status: 403 }
      );
    }

    // Already human-controlled
    if (conversation.status === "HUMAN_ACTIVE") {
      return NextResponse.json({
        success: true,
        status: "HUMAN_ACTIVE",
      });
    }

    // Take over conversation
    const [updatedConversation] = await db
      .update(conversations)
      .set({
        status: "HUMAN_ACTIVE",
      })
      .where(eq(conversations.id, conversationId))
      .returning({
        id: conversations.id,
        status: conversations.status,
      });

    return NextResponse.json({
      success: true,
      conversation: updatedConversation,
    });
  } catch (error) {
    console.error(
      "❌ Conversation takeover failed:",
      error
    );

    return NextResponse.json(
      { error: "Failed to take over conversation" },
      { status: 500 }
    );
  }
}
