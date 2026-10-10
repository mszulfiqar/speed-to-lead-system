import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";

import { db } from "@/db";

import { appointments } from "@/db/schema/appointment";
import { customers } from "@/db/schema/customer";
import { leads } from "@/db/schema/lead";

import { getDemoSession } from "@/lib/demo-session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const sessionId =
      searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        {
          error: "Missing session ID",
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
     * Load appointments belonging to
     * this demo session.
     *
     * appointments → leads → demoSession
     */
    const results = await db
      .select({
        id: appointments.id,

        customerName: customers.name,
        phone: customers.phone,

        service: leads.service,

        startTime:
          appointments.startTime,

        endTime:
          appointments.endTime,

        status:
          appointments.status,

        createdAt:
          appointments.createdAt,
      })
      .from(appointments)
      .innerJoin(
        customers,
        eq(
          appointments.customerId,
          customers.id
        )
      )
      .innerJoin(
        leads,
        eq(
          appointments.leadId,
          leads.id
        )
      )
      .where(
        eq(
          leads.demoSessionId,
          session.id
        )
      )
      .orderBy(
        asc(appointments.startTime)
      );

    return NextResponse.json({
      appointments: results,
    });
  } catch (error) {
    console.error(
      "❌ Calendar API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load appointments",
      },
      {
        status: 500,
      }
    );
  }
}
