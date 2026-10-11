import {
  HVAC_SCHEDULING_CONFIG,
  type BookingMode,
} from "./config";

export type ArrivalWindow = {
  start: string;
  end: string;
};

export type OperatingHours = {
  open: string;
  close: string;
};

/**
 * Returns the weekday's operating hours using a local calendar date.
 * Date format: YYYY-MM-DD.
 */
export function getOperatingHours(
  date: string,
): OperatingHours | null {
  const weekday = new Date(
    `${date}T12:00:00.000Z`,
  ).getUTCDay();

  return HVAC_SCHEDULING_CONFIG.operatingHours[
    weekday as keyof typeof HVAC_SCHEDULING_CONFIG.operatingHours
  ];
}

/**
 * Converts a business-local date and time to a UTC Date.
 */
export function localDateTimeToUtc(
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
  );

  let guess = target;

  for (let i = 0; i < 4; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(guess));

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );

    const representedAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );

    guess += target - representedAsUtc;
  }

  return new Date(guess);
}

/**
 * Returns windows that satisfy the business's scheduling rules.
 * Database availability and booking capacity are checked separately.
 */
export function getEligibleWindows({
  date,
  bookingMode,
  timezone,
  earliestStart,
}: {
  date: string;
  bookingMode: Exclude<BookingMode, "LEAD_CAPTURE_ONLY">;
  timezone: string;
  earliestStart: Date;
}): Array<{
  window: ArrivalWindow;
  startTime: Date;
  endTime: Date;
}> {
  const hours = getOperatingHours(date);

  if (!hours) {
    return [];
  }

  const eligible = [];

  for (const window of HVAC_SCHEDULING_CONFIG.arrivalWindows) {
    if (
      window.start < hours.open ||
      window.end > hours.close
    ) {
      continue;
    }

    if (
      bookingMode === "RESTRICTED" &&
      !HVAC_SCHEDULING_CONFIG.secondaryZoneAllowedStartTimes.includes(
        window.start as (typeof HVAC_SCHEDULING_CONFIG.secondaryZoneAllowedStartTimes)[number],
      )
    ) {
      continue;
    }

    const startTime = localDateTimeToUtc(
      date,
      window.start,
      timezone,
    );

    const endTime = localDateTimeToUtc(
      date,
      window.end,
      timezone,
    );

    if (
      startTime.getTime() < earliestStart.getTime() ||
      endTime.getTime() <= startTime.getTime()
    ) {
      continue;
    }

    eligible.push({
      window,
      startTime,
      endTime,
    });
  }

  return eligible;
}