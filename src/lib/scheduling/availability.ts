import { eq } from "drizzle-orm";

import { db } from "@/db";
import { businesses } from "@/db/schema/business";
import { getServiceZone, HVAC_SCHEDULING_CONFIG } from "./config";
import { getSlotCapacity } from "./capacity";
import { getEligibleWindows } from "./slot-rules";

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

function getDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function getLocalDate(date: Date, timeZone: string): string {
  const parts = getDateParts(date, timeZone);

  return [
    parts.year,
    String(parts.month).padStart(2, "0"),
    String(parts.day).padStart(2, "0"),
  ].join("-");
}

function addDays(date: string, days: number): string {
  const result = new Date(`${date}T12:00:00.000Z`);

  result.setUTCDate(result.getUTCDate() + days);

  return [
    result.getUTCFullYear(),
    String(result.getUTCMonth() + 1).padStart(2, "0"),
    String(result.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

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

  const timeZone = business.timezone;

  // Validate the business's configured timezone.
  new Intl.DateTimeFormat("en-US", { timeZone });

  const earliestStart = new Date(
    now.getTime() +
      HVAC_SCHEDULING_CONFIG.minimumLeadTimeMinutes * 60_000,
  );

  const today = getLocalDate(now, timeZone);
  const slots: ArrivalSlot[] = [];

  for (let offset = 0; offset <= daysAhead; offset++) {
    const date = addDays(today, offset);

    // Use the same scheduling rules covered by our unit tests.
    const eligibleWindows = getEligibleWindows({
      date,
      bookingMode: zone.bookingMode,
      timezone: timeZone,
      earliestStart,
    });

    for (const { startTime, endTime } of eligibleWindows) {
      // Check current database capacity for this arrival window.
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
    timezone: timeZone,
    slots,
  };
}