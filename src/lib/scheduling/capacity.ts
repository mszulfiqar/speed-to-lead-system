import { and, eq, gt, inArray, lt } from "drizzle-orm";

import { db } from "@/db";
import { appointments } from "@/db/schema/appointment";
import { HVAC_SCHEDULING_CONFIG } from "./config";

export async function getSlotCapacity({
  businessId,
  startTime,
  endTime,
}: {
  businessId: string;
  startTime: Date;
  endTime: Date;
}) {
  if (endTime.getTime() <= startTime.getTime()) {
    throw new Error("Slot end time must be after start time");
  }

  const overlappingAppointments = await db
    .select({
      id: appointments.id,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, businessId),
        lt(appointments.startTime, endTime),
        gt(appointments.endTime, startTime),
        inArray(appointments.status, ["PENDING", "CONFIRMED"]),
      ),
    );

  const capacity = HVAC_SCHEDULING_CONFIG.maxBookingsPerSlot;
  const occupied = overlappingAppointments.length;

  return {
    occupied,
    capacity,
    availableBookings: Math.max(0, capacity - occupied),
    isAvailable: occupied < capacity,
  };
}