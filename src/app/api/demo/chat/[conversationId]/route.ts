import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";

import { db } from "@/db";
import { conversations } from "@/db/schema/conversation";
import { messages } from "@/db/schema/message";
import { getDemoSession } from "@/lib/demo-session";
import { leads } from "@/db/schema/lead";
import { processConversation } from "@/lib/ai/process-conversation";

type Props = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: Props
) {
  try {
    const { conversationId } = await params;

    const url = new URL(request.url);
    const sessionId =
      url.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        {
          error: "Missing session ID",
        },
        { status: 400 }
      );
    }

    /*
     * 1. Verify demo session
     */

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

    /*
     * 2. Find conversation
     */

    const [conversation] =
      await db
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
      return NextResponse.json(
        {
          error:
            "Conversation not found",
        },
        { status: 404 }
      );
    }

    /*
     * 3. Find the lead belonging
     *    to this conversation.
     */

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
      return NextResponse.json(
        {
          error: "Lead not found",
        },
        { status: 404 }
      );
    }

    /*
     * 4. Verify ownership.
     *
     * The conversation must belong
     * to the current demo session.
     */

    if (
      lead.demoSessionId !==
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

    /*
     * 5. Load messages
     */

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

    return NextResponse.json({
      success: true,
      conversation,
      messages:
        conversationMessages,
    });
  } catch (error) {
    console.error(
      "❌ GET CHAT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load conversation",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: Props
) {
  try {
    const { conversationId } = await params;

    const body = await request.json();

    const {
      sessionId,
      prompt,
    } = body;

    console.log("🔥 CHAT POST ROUTE HIT");
    console.log("conversationId:", conversationId);
    console.log("sessionId:", sessionId);
    console.log("prompt:", prompt);

    /*
     * Validate input
     */

    if (
      typeof sessionId !== "string" ||
      typeof prompt !== "string" ||
      !prompt.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid request",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Verify demo session
     */

    const session =
      await getDemoSession(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired demo session",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Find conversation
     */

    const [conversation] =
      await db
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
      return NextResponse.json(
        {
          error:
            "Conversation not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Make sure this conversation
     * belongs to the same business
     * as the demo session.
     */

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
      return NextResponse.json(
        {
          error:
            "Lead not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Security check:
     *
     * The lead must belong to
     * this demo session.
     */

    if (
      lead.demoSessionId !==
      session.id
    ) {
      return NextResponse.json(
        {
          error:
            "Conversation does not belong to this session",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Save customer's message
     */

    await db
      .insert(messages)
      .values({
        conversationId,
        senderType: "CUSTOMER",
        content: prompt.trim(),
      });

    /*
     * Run AI
     */

    const aiMessage =
      await processConversation(
        conversationId
      );

    /*
     * Load complete conversation
     * from database.
     */

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

    /*
     * Return messages
     */

    return NextResponse.json({
      success: true,
      aiMessage,
      messages:
        conversationMessages,
    });
  } catch (error) {
    console.error(
      "❌ CHAT POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to process message",
      },
      {
        status: 500,
      }
    );
  }
}
