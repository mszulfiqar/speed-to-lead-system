import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";

import { conversations } from "@/db/schema/conversation";
import { leads } from "@/db/schema/lead";
import { messages } from "@/db/schema/message";

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
    const { conversationId } =
      await params;

    const body = await request.json();

    const sessionId = body.sessionId;
    const content = body.content;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      );
    }

    if (
      !content ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    const session =
      await getDemoSession(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired demo session",
        },
        { status: 401 }
      );
    }

    const [conversation] =
      await db
        .select({
          id: conversations.id,
          status: conversations.status,
          leadId: conversations.leadId,
          demoSessionId:
            leads.demoSessionId,
        })
        .from(conversations)
        .innerJoin(
          leads,
          eq(
            conversations.leadId,
            leads.id
          )
        )
        .where(
          eq(
            conversations.id,
            conversationId
          )
        )
        .limit(1);

    if (!conversation) {
      return NextResponse.json(
        {
          error:
            "Conversation not found",
        },
        { status: 404 }
      );
    }

    if (
      conversation.demoSessionId !==
      session.id
    ) {
      return NextResponse.json(
        {
          error:
            "Conversation does not belong to this session",
        },
        { status: 403 }
      );
    }

    if (
      conversation.status !==
      "HUMAN_ACTIVE"
    ) {
      return NextResponse.json(
        {
          error:
            "Conversation is not under human control",
        },
        { status: 409 }
      );
    }

    const [message] =
      await db
        .insert(messages)
        .values({
          conversationId,
          senderType: "HUMAN",
          content: content.trim(),
        })
        .returning();

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error(
      "❌ Human message failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to send human message",
      },
      { status: 500 }
    );
  }
}
