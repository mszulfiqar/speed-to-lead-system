
import { and, eq, gt, inArray, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { appointments } from "@/db/schema/appointment";
import { businesses } from "@/db/schema/business";
import { leads } from "@/db/schema/lead";

import { HVAC_SCHEDULING_CONFIG, getServiceZone } from "./config";
import {
  getEligibleAvailabilityWindows,
  getLocalDate,
} from "./availability-rules";

type BookAppointmentInput = {
  leadId: string;
  startTime: Date;
  endTime: Date;
};

export async function bookAppointment({
  leadId,
  startTime,
  endTime,
}: BookAppointmentInput) {
  if (
    Number.isNaN(startTime.getTime()) ||
    Number.isNaN(endTime.getTime()) ||
    endTime.getTime() <= startTime.getTime()
  ) {
    throw new Error("INVALID_APPOINTMENT_TIME");
  }

  return db.transaction(async (tx) => {
    /*
     * Load the lead and its business settings.
     */
    const [lead] = await tx
      .select({
        id: leads.id,
        businessId: leads.businessId,
        customerId: leads.customerId,
        zipCode: leads.zipCode,
        timezone: businesses.timezone,
      })
      .from(leads)
      .innerJoin(
        businesses,
        eq(leads.businessId, businesses.id),
      )
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      throw new Error("LEAD_NOT_FOUND");
    }

    /*
     * Serialize booking attempts for this business.
     * The lock remains held until the transaction ends.
     */
    await tx.execute(sql`
      SELECT pg_advisory_xact_lock(
        hashtextextended(${lead.businessId}, 0)
      )
    `);

    /*
     * Prevent a second appointment for the same lead.
     */
    const [existing] = await tx
      .select({ id: appointments.id })
      .from(appointments)
      .where(eq(appointments.leadId, lead.id))
      .limit(1);

    if (existing) {
      throw new Error("APPOINTMENT_ALREADY_EXISTS");
    }

    /*
     * Check service-zone eligibility.
     */
    if (!lead.zipCode) {
      throw new Error("ZIP_CODE_REQUIRED");
    }

    const zone = getServiceZone(lead.zipCode);

    if (!zone) {
      throw new Error("UNKNOWN_SERVICE_ZONE");
    }

    if (zone.bookingMode === "LEAD_CAPTURE_ONLY") {
      throw new Error("OUTSIDE_BOOKING_AREA");
    }

    /*
     * Recalculate eligible windows using the current time.
     * Never trust a slot just because the client submitted it.
     */
    const now = new Date();
    const localDate = getLocalDate(startTime, lead.timezone);

    const eligibleWindows = getEligibleAvailabilityWindows({
      zipCode: lead.zipCode,
      date: localDate,
      timezone: lead.timezone,
      now,
    });

    const requestedWindow = eligibleWindows.find(
      ({ startTime: eligibleStart, endTime: eligibleEnd }) =>
        eligibleStart.getTime() === startTime.getTime() &&
        eligibleEnd.getTime() === endTime.getTime(),
    );

    if (!requestedWindow) {
      throw new Error("SLOT_NOT_ELIGIBLE");
    }

    /*
     * Count active appointments overlapping this slot.
     * Run this query AFTER acquiring the business lock.
     */
    const overlapping = await tx
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, lead.businessId),
          lt(appointments.startTime, endTime),
          gt(appointments.endTime, startTime),
          inArray(appointments.status, [
            "PENDING",
            "CONFIRMED",
          ]),
        ),
      );

    if (
      overlapping.length >=
      HVAC_SCHEDULING_CONFIG.maxBookingsPerSlot
    ) {
      throw new Error("SLOT_FULL");
    }

    /*
     * Only insert after every validation succeeds.
     */
    const [appointment] = await tx
      .insert(appointments)
      .values({
        businessId: lead.businessId,
        leadId: lead.id,
        customerId: lead.customerId,
        startTime,
        endTime,
        status: "CONFIRMED",
      })
      .returning();

    return appointment;
  });
}
