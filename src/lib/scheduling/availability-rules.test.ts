import test from "node:test";
import assert from "node:assert/strict";

import {
  addDays,
  getEligibleAvailabilityWindows,
  getLocalDate,
} from "./availability-rules";

const timezone = "America/Chicago";

test("gets the business-local date instead of the UTC date", () => {
  // October 13 at 02:00 UTC is still October 12 in Chicago.
  const now = new Date("2026-10-13T02:00:00.000Z");

  assert.equal(getLocalDate(now, timezone), "2026-10-12");
});

test("adds calendar days across a month boundary", () => {
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
});

test("returns no windows for an unknown ZIP code", () => {
  const windows = getEligibleAvailabilityWindows({
    zipCode: "11111",
    date: "2026-10-13",
    timezone,
    now: new Date("2026-10-13T12:00:00.000Z"),
  });

  assert.deepEqual(windows, []);
});

test("returns no windows for an out-of-area ZIP code", () => {
  const windows = getEligibleAvailabilityWindows({
    zipCode: "90210",
    date: "2026-10-13",
    timezone,
    now: new Date("2026-10-13T12:00:00.000Z"),
  });

  assert.deepEqual(windows, []);
});

test("restricted ZIP codes only get permitted afternoon windows", () => {
  const windows = getEligibleAvailabilityWindows({
    zipCode: "75070",
    date: "2026-10-13",
    timezone,
    now: new Date("2026-10-13T12:00:00.000Z"),
  });

  assert.deepEqual(
    windows.map((slot) => slot.window.start),
    ["15:00"],
  );
});

test("excludes windows that start before the minimum lead time", () => {
  const windows = getEligibleAvailabilityWindows({
    zipCode: "75001",
    date: "2026-10-13",
    timezone,
    now: new Date("2026-10-13T14:00:00.000Z"),
  });

  // 14:00 UTC is 09:00 Chicago time.
  // The earliest eligible start is 11:00 Chicago time.
  assert.deepEqual(
    windows.map((slot) => slot.window.start),
    ["13:00", "15:00"],
  );
});

test("Sunday has no eligible windows", () => {
  const windows = getEligibleAvailabilityWindows({
    zipCode: "75001",
    date: "2026-10-18",
    timezone,
    now: new Date("2026-10-17T12:00:00.000Z"),
  });

  assert.deepEqual(windows, []);
});
