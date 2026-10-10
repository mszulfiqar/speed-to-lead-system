import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";

import { appointments } from "@/db/schema/appointment";
import { customers } from "@/db/schema/customer";
import { leads } from "@/db/schema/lead";

import { getDemoSession } from "@/lib/demo-session";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      sessionId,
      leadId,
      startTime,
      endTime,
    } = body;

    if (
      !sessionId ||
      !leadId ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        {
          error:
            "Missing sessionId, leadId, startTime, or endTime",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Verify demo session.
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
     * Find the lead and make sure it
     * belongs to this demo session.
     */
    const [lead] = await db
      .select({
        id: leads.id,
        businessId: leads.businessId,
        customerId: leads.customerId,
        demoSessionId: leads.demoSessionId,
      })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      return NextResponse.json(
        {
          error: "Lead not found",
        },
        {
          status: 404,
        }
      );
    }

    if (lead.demoSessionId !== session.id) {
      return NextResponse.json(
        {
          error:
            "Lead does not belong to this demo session",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Make sure the customer exists.
     */
    const [customer] = await db
      .select({
        id: customers.id,
      })
      .from(customers)
      .where(eq(customers.id, lead.customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        {
          error: "Customer not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Create appointment.
     */
    const [appointment] = await db
      .insert(appointments)
      .values({
        businessId: lead.businessId,
        leadId: lead.id,
        customerId: customer.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "PENDING",
      })
      .returning();

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error(
      "❌ Create demo appointment error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create appointment",
      },
      {
        status: 500,
      }
    );
  }
}
