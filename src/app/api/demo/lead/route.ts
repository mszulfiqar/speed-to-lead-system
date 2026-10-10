import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

import { db } from "@/db";

import { businesses } from "@/db/schema/business";
import { customers } from "@/db/schema/customer";
import { leads } from "@/db/schema/lead";
import { phoneNumbers } from "@/db/schema/phone-number";
import { messages } from "@/db/schema/message";
import { conversations } from "@/db/schema/conversation";

import { getDemoSession } from "@/lib/demo-session";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      sessionId,
      name,
      phone,
      service,
      message,
    } = body;

    /*
     * 1. Validate request
     */

    if (
      typeof sessionId !== "string" ||
      typeof name !== "string" ||
      typeof phone !== "string" ||
      typeof service !== "string" ||
      typeof message !== "string"
    ) {
      return NextResponse.json(
        {
          error: "Invalid request data",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 2. Verify demo session
     */

    const session =
      await getDemoSession(sessionId);

    if (!session) {
      console.log(
        "❌ Invalid or expired demo session"
      );

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
     * 3. Get demo business
     */

    const businessId =
      process.env.DEMO_BUSINESS_ID;

    if (!businessId) {
      console.log(
        "❌ DEMO_BUSINESS_ID is missing"
      );

      return NextResponse.json(
        {
          error:
            "Demo business is not configured",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * 4. Verify business exists
     */

    const [business] = await db
      .select()
      .from(businesses)
      .where(
        eq(
          businesses.id,
          businessId
        )
      )
      .limit(1);

    if (!business) {
      console.log(
        "❌ Demo business not found"
      );

      return NextResponse.json(
        {
          error:
            "Demo business not found",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * 5. Find or create customer
     */

    let [customer] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(
            customers.businessId,
            business.id
          ),
          eq(
            customers.phone,
            phone
          )
        )
      )
      .limit(1);

    if (!customer) {
      [customer] = await db
        .insert(customers)
        .values({
          businessId: business.id,
          name,
          phone,
        })
        .returning();
    }

    /*
     * 6. Create lead
     */

    const [lead] = await db
      .insert(leads)
      .values({
        businessId: business.id,
        customerId: customer.id,
        source: session.source,
        service,
        demoSessionId: session.id,
      })
      .returning();

    /*
     * 7. Find active phone number
     */

    const [phoneNumber] =
      await db
        .select()
        .from(phoneNumbers)
        .where(
          and(
            eq(
              phoneNumbers.businessId,
              business.id
            ),
            eq(
              phoneNumbers.status,
              "ACTIVE"
            )
          )
        )
        .limit(1);

    /*
     * 8. Create conversation
     */

    const [conversation] =
      await db
        .insert(conversations)
        .values({
          businessId: business.id,
          customerId: customer.id,
          leadId: lead.id,
          phoneNumberId:
            phoneNumber?.id,
          channel: "WEB_CHAT",
          status: "AI_ACTIVE",
        })
        .returning();

    /*
     * 9. Save customer's first message
     */

    const [customerMessage] =
      await db
        .insert(messages)
        .values({
          conversationId:
            conversation.id,
          senderType: "CUSTOMER",
          content: message,
        })
        .returning();

    /*
     * 10. Start AI processing
     *
     * IMPORTANT:
     *
     * We DO NOT await processConversation()
     * anymore.
     *
     * Inngest handles it in the background.
     */

    await inngest.send({
      name: "demo/conversation.created",
      data: {
        conversationId:
          conversation.id,
          newMessage:
      customerMessage.content,
      },
    });

    console.log(
      "🚀 AI job queued:",
      conversation.id
    );

    /*
     * 11. Return immediately
     */

    return NextResponse.json({
      success: true,

      customer,

      lead,

      conversation,

      message: customerMessage,
    });
  } catch (error) {
    console.error(
      "❌ Demo lead error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create demo lead",
      },
      {
        status: 500,
      }
    );
  }
}
