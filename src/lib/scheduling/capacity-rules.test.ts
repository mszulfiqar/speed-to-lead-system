import test from "node:test";
import assert from "node:assert/strict";

import { calculateSlotCapacity } from "./capacity-rules";

const startTime = new Date("2026-10-13T13:00:00.000Z");
const endTime = new Date("2026-10-13T15:00:00.000Z");

function makeAppointment(
  status:
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED"
    | "COMPLETED"
    | "NO_SHOW",
  start = startTime,
  end = endTime,
) {
  return {
    status,
    startTime: start,
    endTime: end,
  };
}

function calculate(
  appointments: ReturnType<typeof makeAppointment>[],
) {
  return calculateSlotCapacity({
    appointments,
    startTime,
    endTime,
    capacity: 2,
  });
}

test("empty slot has two available bookings", () => {
  assert.deepEqual(calculate([]), {
    occupied: 0,
    capacity: 2,
    availableBookings: 2,
    isAvailable: true,
  });
});

test("one pending appointment leaves one spot", () => {
  const result = calculate([
    makeAppointment("PENDING"),
  ]);

  assert.equal(result.occupied, 1);
  assert.equal(result.availableBookings, 1);
  assert.equal(result.isAvailable, true);
});

test("two confirmed appointments fill the slot", () => {
  const result = calculate([
    makeAppointment("CONFIRMED"),
    makeAppointment("CONFIRMED"),
  ]);

  assert.equal(result.occupied, 2);
  assert.equal(result.availableBookings, 0);
  assert.equal(result.isAvailable, false);
});

test("pending and confirmed appointments both consume capacity", () => {
  const result = calculate([
    makeAppointment("PENDING"),
    makeAppointment("CONFIRMED"),
  ]);

  assert.equal(result.occupied, 2);
  assert.equal(result.isAvailable, false);
});

test("cancelled appointments do not consume capacity", () => {
  const result = calculate([
    makeAppointment("CANCELLED"),
  ]);

  assert.equal(result.occupied, 0);
  assert.equal(result.availableBookings, 2);
});

test("completed and no-show appointments do not consume capacity", () => {
  const result = calculate([
    makeAppointment("COMPLETED"),
    makeAppointment("NO_SHOW"),
  ]);

  assert.equal(result.occupied, 0);
  assert.equal(result.availableBookings, 2);
});

test("appointments outside the requested window do not consume capacity", () => {
  const result = calculate([
    makeAppointment(
      "CONFIRMED",
      new Date("2026-10-13T10:00:00.000Z"),
      new Date("2026-10-13T12:00:00.000Z"),
    ),
  ]);

  assert.equal(result.occupied, 0);
  assert.equal(result.availableBookings, 2);
});

test("overlapping appointments consume capacity", () => {
  const result = calculate([
    makeAppointment(
      "CONFIRMED",
      new Date("2026-10-13T14:00:00.000Z"),
      new Date("2026-10-13T16:00:00.000Z"),
    ),
  ]);

  assert.equal(result.occupied, 1);
  assert.equal(result.availableBookings, 1);
});

test("invalid slot duration is rejected", () => {
  assert.throws(
    () =>
      calculateSlotCapacity({
        appointments: [],
        startTime: endTime,
        endTime: startTime,
        capacity: 2,
      }),
    /Slot end time must be after start time/,
  );
});
