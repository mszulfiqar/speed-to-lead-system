import {
  HVAC_SCHEDULING_CONFIG,
  getServiceZone,
} from "./config";
import { getEligibleWindows } from "./slot-rules";

export function getLocalDate(
  date: Date,
  timeZone: string,
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return [
    values.year,
    values.month,
    values.day,
  ].join("-");
}

export function addDays(
  date: string,
  days: number,
): string {
  const result = new Date(`${date}T12:00:00.000Z`);

  result.setUTCDate(result.getUTCDate() + days);

  return [
    result.getUTCFullYear(),
    String(result.getUTCMonth() + 1).padStart(2, "0"),
    String(result.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function getEligibleAvailabilityWindows({
  zipCode,
  date,
  timezone,
  now,
}: {
  zipCode: string;
  date: string;
  timezone: string;
  now: Date;
}) {
  const zone = getServiceZone(zipCode);

  if (!zone || zone.bookingMode === "LEAD_CAPTURE_ONLY") {
    return [];
  }

  const earliestStart = new Date(
    now.getTime() +
      HVAC_SCHEDULING_CONFIG.minimumLeadTimeMinutes * 60_000,
  );

  return getEligibleWindows({
    date,
    bookingMode: zone.bookingMode,
    timezone,
    earliestStart,
  });
}
