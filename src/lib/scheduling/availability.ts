
import { and, eq, gt, inArray, lt } from "drizzle-orm";

import { db } from "@/db";
import { appointments } from "@/db/schema/appointment";
import { businesses } from "@/db/schema/business";
import {
  getServiceZone,
  HVAC_SCHEDULING_CONFIG,
} from "./config";

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

const TIME_ZONE = HVAC_SCHEDULING_CONFIG.timezone;

function getDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
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
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
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

/**
 * Converts a business-local date and time into a UTC instant.
 * Iterative conversion handles ordinary timezone offsets and DST.
 */
function localDateTimeToUtc(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  const target = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
  );

  let guess = target;

  for (let i = 0; i < 4; i++) {
    const parts = getDateParts(new Date(guess), timeZone);

    const representedAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );

    guess += target - representedAsUtc;
  }

  return new Date(guess);
}

function getOperatingHours(date: string) {
  const weekday = new Date(
    `${date}T12:00:00.000Z`,
  ).getUTCDay();

  return HVAC_SCHEDULING_CONFIG.operatingHours[
    weekday as keyof typeof HVAC_SCHEDULING_CONFIG.operatingHours
  ];
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

  // Validate the configured timezone before calculating slots.
  new Intl.DateTimeFormat("en-US", { timeZone });

  const earliestStart = new Date(
    now.getTime() +
      HVAC_SCHEDULING_CONFIG.minimumLeadTimeMinutes * 60_000,
  );

  const today = getLocalDate(now, timeZone);
  const slots: ArrivalSlot[] = [];

  for (let offset = 0; offset <= daysAhead; offset++) {
    const date = addDays(today, offset);
    const hours = getOperatingHours(date);

    if (!hours) continue;

    for (const window of HVAC_SCHEDULING_CONFIG.arrivalWindows) {
      if (
        zone.bookingMode === "RESTRICTED" &&
        !HVAC_SCHEDULING_CONFIG.secondaryZoneAllowedStartTimes
          .includes(
            window.start as (typeof HVAC_SCHEDULING_CONFIG.secondaryZoneAllowedStartTimes)[number],
          )
      ) {
        continue;
      }

      // Do not offer windows outside the day's operating hours.
      if (
        window.start < hours.open ||
        window.end > hours.close
      ) {
        continue;
      }

      const startTime = localDateTimeToUtc(
        date,
        window.start,
        timeZone,
      );

      const endTime = localDateTimeToUtc(
        date,
        window.end,
        timeZone,
      );

      if (
        startTime.getTime() < earliestStart.getTime() ||
        endTime.getTime() <= startTime.getTime()
      ) {
        continue;
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
            inArray(appointments.status, [
              "PENDING",
              "CONFIRMED",
            ]),
          ),
        );

      const occupied = overlappingAppointments.length;
      const capacity =
        HVAC_SCHEDULING_CONFIG.maxBookingsPerSlot;

      if (occupied >= capacity) continue;

      slots.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        availableBookings: capacity - occupied,
      });
    }
  }

  return {
    bookingMode: zone.bookingMode,
    timezone: timeZone,
    slots,
  };
}
