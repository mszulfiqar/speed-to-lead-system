
export type BookingMode =
  | "DIRECT"
  | "RESTRICTED"
  | "LEAD_CAPTURE_ONLY";

export type ServiceZone = {
  zipCodes: readonly string[];
  bookingMode: BookingMode;
};

export const HVAC_SCHEDULING_CONFIG = {
  timezone: "America/Chicago",

  minimumLeadTimeMinutes: 120,

  maxBookingsPerSlot: 2,

  slotDurationMinutes: 120,

  serviceZones: {
    primary: {
      zipCodes: ["75001", "75024", "75201"],
      bookingMode: "DIRECT",
    },
    secondary: {
      zipCodes: ["75070", "75034"],
      bookingMode: "RESTRICTED",
    },
    outOfBounds: {
      zipCodes: ["90210", "30301"],
      bookingMode: "LEAD_CAPTURE_ONLY",
    },
  },

  operatingHours: {
    0: null, // Sunday: closed
    1: { open: "08:00", close: "18:00" },
    2: { open: "08:00", close: "18:00" },
    3: { open: "08:00", close: "18:00" },
    4: { open: "08:00", close: "18:00" },
    5: { open: "08:00", close: "18:00" },
    6: { open: "09:00", close: "15:00" },
  },

  arrivalWindows: [
    { start: "08:00", end: "10:00" },
    { start: "10:00", end: "12:00" },
    { start: "13:00", end: "15:00" },
    { start: "15:00", end: "17:00" },
  ],

  secondaryZoneAllowedStartTimes: ["13:00", "15:00"],

  emergencyKeywords: [
    "gas leak",
    "flooding",
    "sparks",
    "no heat",
  ],
} as const;

export function getServiceZone(
  zipCode: string,
): ServiceZone | null {
  const zip = zipCode.trim();

  const zones: ServiceZone[] = [
    HVAC_SCHEDULING_CONFIG.serviceZones.primary,
    HVAC_SCHEDULING_CONFIG.serviceZones.secondary,
    HVAC_SCHEDULING_CONFIG.serviceZones.outOfBounds,
  ];

  return (
    zones.find((zone) => zone.zipCodes.includes(zip)) ?? null
  );
}
