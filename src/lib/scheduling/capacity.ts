import { and, eq, gt, inArray, lt } from "drizzle-orm";

import { db } from "@/db";
import { appointments } from "@/db/schema/appointment";
import { HVAC_SCHEDULING_CONFIG } from "./config";
import { calculateSlotCapacity } from "./capacity-rules";

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
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      status: appointments.status,
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

  return calculateSlotCapacity({
    appointments: overlappingAppointments,
    startTime,
    endTime,
    capacity: HVAC_SCHEDULING_CONFIG.maxBookingsPerSlot,
  });
}
