import { eq } from "drizzle-orm";

import { db } from "@/db";
import { businesses } from "@/db/schema/business";
import { getServiceZone } from "./config";
import { getSlotCapacity } from "./capacity";
import {
  addDays,
  getEligibleAvailabilityWindows,
  getLocalDate,
} from "./availability-rules";

type AvailabilityOptions = {
  businessId: string;
  zipCode: string;
  daysAhead?: number;
  now?: Date;
};

type ArrivalSlot = {
  startTime: string;
  endTime: string;
  availableBookings: number;
};

export async function getAvailableSlots({
  businessId,
  zipCode,
  daysAhead = 3,
  now = new Date(),
}: AvailabilityOptions) {
  if (
    !Number.isInteger(daysAhead) ||
    daysAhead < 0 ||
    daysAhead > 14
  ) {
    throw new Error("daysAhead must be between 0 and 14");
  }

  if (Number.isNaN(now.getTime())) {
    throw new Error("now must be a valid date");
  }

  const zone = getServiceZone(zipCode);

  if (!zone) {
    return {
      bookingMode: "UNKNOWN" as const,
      slots: [] as ArrivalSlot[],
    };
  }

  if (zone.bookingMode === "LEAD_CAPTURE_ONLY") {
    return {
      bookingMode: zone.bookingMode,
      slots: [] as ArrivalSlot[],
    };
  }

  const [business] = await db
    .select({
      timezone: businesses.timezone,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    throw new Error("Business not found");
  }

  const timezone = business.timezone;

  // Validate the business's configured timezone.
  new Intl.DateTimeFormat("en-US", { timeZone: timezone });

  const today = getLocalDate(now, timezone);
  const slots: ArrivalSlot[] = [];

  for (let offset = 0; offset <= daysAhead; offset++) {
    const date = addDays(today, offset);

    const eligibleWindows = getEligibleAvailabilityWindows({
      zipCode,
      date,
      timezone,
      now,
    });

    for (const { startTime, endTime } of eligibleWindows) {
      const capacity = await getSlotCapacity({
        businessId,
        startTime,
        endTime,
      });

      if (!capacity.isAvailable) {
        continue;
      }

      slots.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        availableBookings: capacity.availableBookings,
      });
    }
  }

  return {
    bookingMode: zone.bookingMode,
    timezone,
    slots,
  };
}
