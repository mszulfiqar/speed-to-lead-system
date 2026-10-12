import test from "node:test";
import assert from "node:assert/strict";

import { getEligibleWindows } from "./slot-rules";

const timezone = "America/Chicago";

function makeEarliestStart(date: string, time: string): Date {
  return new Date(`${date}T${time}:00-05:00`);
}

test("weekday direct booking offers eligible windows", () => {
  const slots = getEligibleWindows({
    date: "2026-10-13", // Tuesday
    bookingMode: "DIRECT",
    timezone,
    earliestStart: makeEarliestStart("2026-10-13", "07:00"),
  });

  assert.deepEqual(
    slots.map((slot) => slot.window.start),
    ["08:00", "10:00", "13:00", "15:00"],
  );
});

test("Saturday only offers windows inside Saturday hours", () => {
  const slots = getEligibleWindows({
    date: "2026-10-17", // Saturday
    bookingMode: "DIRECT",
    timezone,
    earliestStart: makeEarliestStart("2026-10-17", "07:00"),
  });

  assert.deepEqual(
    slots.map((slot) => slot.window.start),
    ["10:00", "13:00"],
  );
});

test("Sunday offers no slots", () => {
  const slots = getEligibleWindows({
    date: "2026-10-18", // Sunday
    bookingMode: "DIRECT",
    timezone,
    earliestStart: makeEarliestStart("2026-10-18", "07:00"),
  });

  assert.equal(slots.length, 0);
});

test("restricted zone only offers permitted afternoon windows", () => {
  const slots = getEligibleWindows({
    date: "2026-10-13",
    bookingMode: "RESTRICTED",
    timezone,
    earliestStart: makeEarliestStart("2026-10-13", "07:00"),
  });

  assert.deepEqual(
    slots.map((slot) => slot.window.start),
    ["13:00", "15:00"],
  );
});

test("a slot exactly at the two-hour cutoff is allowed", () => {
  const slots = getEligibleWindows({
    date: "2026-10-13",
    bookingMode: "DIRECT",
    timezone,
    earliestStart: makeEarliestStart("2026-10-13", "10:00"),
  });

  assert.deepEqual(
    slots.map((slot) => slot.window.start),
    ["10:00", "13:00", "15:00"],
  );
});

test("slots before the two-hour cutoff are excluded", () => {
  const slots = getEligibleWindows({
    date: "2026-10-13",
    bookingMode: "DIRECT",
    timezone,
    earliestStart: makeEarliestStart("2026-10-13", "10:01"),
  });

  assert.deepEqual(
    slots.map((slot) => slot.window.start),
    ["13:00", "15:00"],
  );
});

test("returned slot times represent the correct business-local hours", () => {
  const slots = getEligibleWindows({
    date: "2026-10-13",
    bookingMode: "DIRECT",
    timezone,
    earliestStart: makeEarliestStart("2026-10-13", "07:00"),
  });

  const firstSlot = slots[0];

  assert.ok(firstSlot);

  assert.equal(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(firstSlot.startTime),
    "08:00",
  );

  assert.equal(
    firstSlot.endTime.getTime() - firstSlot.startTime.getTime(),
    2 * 60 * 60 * 1000,
  );
});