
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { leads } from "@/db/schema/lead";
import { getDemoSession } from "@/lib/demo-session";
import { bookAppointment } from "@/lib/scheduling/book-appointment";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { sessionId, leadId, startTime, endTime } = body;

    if (
      typeof sessionId !== "string" ||
      typeof leadId !== "string" ||
      typeof startTime !== "string" ||
      typeof endTime !== "string"
    ) {
      return NextResponse.json(
        {
          error: "Missing or invalid sessionId, leadId, startTime, or endTime",
        },
        { status: 400 },
      );
    }

    const session = await getDemoSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired demo session" },
        { status: 401 },
      );
    }

    const [lead] = await db
      .select({
        id: leads.id,
        demoSessionId: leads.demoSessionId,
      })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 },
      );
    }

    if (lead.demoSessionId !== session.id) {
      return NextResponse.json(
        { error: "Lead does not belong to this demo session" },
        { status: 403 },
      );
    }

    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);

    if (
      Number.isNaN(parsedStartTime.getTime()) ||
      Number.isNaN(parsedEndTime.getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid appointment date or time" },
        { status: 400 },
      );
    }

    const appointment = await bookAppointment({
      leadId: lead.id,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
    });

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";

    const clientErrors: Record<
      string,
      { status: number; message: string }
    > = {
      INVALID_APPOINTMENT_TIME: {
        status: 400,
        message: "Invalid appointment time",
      },
      LEAD_NOT_FOUND: {
        status: 404,
        message: "Lead not found",
      },
      APPOINTMENT_ALREADY_EXISTS: {
        status: 409,
        message: "An appointment already exists for this lead",
      },
      ZIP_CODE_REQUIRED: {
        status: 409,
        message: "A ZIP code is required before booking",
      },
      UNKNOWN_SERVICE_ZONE: {
        status: 409,
        message: "The service area has not been verified",
      },
      OUTSIDE_BOOKING_AREA: {
        status: 409,
        message: "This ZIP code is outside the direct booking area",
      },
      SLOT_NOT_ELIGIBLE: {
        status: 409,
        message: "This appointment time is not eligible",
      },
      SLOT_FULL: {
        status: 409,
        message: "This appointment slot is fully booked",
      },
    };

    const knownError = clientErrors[code];

    if (knownError) {
      return NextResponse.json(
        { error: knownError.message },
        { status: knownError.status },
      );
    }

    console.error("❌ Appointment approval error:", error);

    return NextResponse.json(
      { error: "Failed to approve appointment" },
      { status: 500 },
    );
  }
}
