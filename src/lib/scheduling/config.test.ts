
import test from "node:test";
import assert from "node:assert/strict";

import {
  getServiceZone,
  HVAC_SCHEDULING_CONFIG,
} from "./config";

test("primary ZIP codes allow direct booking", () => {
  for (const zip of ["75001", "75024", "75201"]) {
    assert.equal(getServiceZone(zip)?.bookingMode, "DIRECT");
  }
});

test("secondary ZIP codes use restricted booking", () => {
  for (const zip of ["75070", "75034"]) {
    assert.equal(getServiceZone(zip)?.bookingMode, "RESTRICTED");
  }
});

test("out-of-bounds ZIP codes cannot book directly", () => {
  for (const zip of ["90210", "30301"]) {
    assert.equal(
      getServiceZone(zip)?.bookingMode,
      "LEAD_CAPTURE_ONLY",
    );
  }
});

test("unknown ZIP codes are not eligible for booking", () => {
  assert.equal(getServiceZone("00000"), null);
});

test("Sunday is closed", () => {
  assert.equal(HVAC_SCHEDULING_CONFIG.operatingHours[0], null);
});

test("Saturday closes at 3 PM", () => {
  assert.deepEqual(
    HVAC_SCHEDULING_CONFIG.operatingHours[6],
    { open: "09:00", close: "15:00" },
  );
});

test("secondary zone allows afternoon windows only", () => {
  assert.deepEqual(
    HVAC_SCHEDULING_CONFIG.secondaryZoneAllowedStartTimes,
    ["13:00", "15:00"],
  );
});

test("minimum lead time is two hours", () => {
  assert.equal(
    HVAC_SCHEDULING_CONFIG.minimumLeadTimeMinutes,
    120,
  );
});

test("each arrival window is two hours long", () => {
  for (const slot of HVAC_SCHEDULING_CONFIG.arrivalWindows) {
    const [startHour, startMinute] = slot.start.split(":").map(Number);
    const [endHour, endMinute] = slot.end.split(":").map(Number);

    const duration =
      endHour * 60 + endMinute - (startHour * 60 + startMinute);

    assert.equal(duration, 120, `${slot.start}-${slot.end}`);
  }
});
