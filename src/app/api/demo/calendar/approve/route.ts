import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";

import { appointments } from "@/db/schema/appointment";
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
     * Find the lead and make sure
     * it belongs to this demo session.
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
     * Prevent duplicate appointments
     * for the same lead.
     */
    const [existingAppointment] =
      await db
        .select({
          id: appointments.id,
          status: appointments.status,
        })
        .from(appointments)
        .where(
          eq(
            appointments.leadId,
            lead.id
          )
        )
        .limit(1);

    if (existingAppointment) {
      return NextResponse.json(
        {
          error:
            "An appointment already exists for this lead",
          appointment:
            existingAppointment,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Create confirmed appointment.
     */
    const [appointment] =
      await db
        .insert(appointments)
        .values({
          businessId: lead.businessId,
          leadId: lead.id,
          customerId: lead.customerId,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          status: "CONFIRMED",
        })
        .returning();

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error(
      "❌ Approve booking error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to approve booking",
      },
      {
        status: 500,
      }
    );
  }
}
