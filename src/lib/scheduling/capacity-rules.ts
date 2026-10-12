export type CapacityAppointment = {
  startTime: Date;
  endTime: Date;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED"
    | "COMPLETED"
    | "NO_SHOW";
};

export type SlotCapacity = {
  occupied: number;
  capacity: number;
  availableBookings: number;
  isAvailable: boolean;
};

/**
 * Calculates capacity using appointments that overlap the requested slot.
 * Cancelled, completed, and no-show appointments do not consume capacity.
 */
export function calculateSlotCapacity({
  appointments,
  startTime,
  endTime,
  capacity,
}: {
  appointments: CapacityAppointment[];
  startTime: Date;
  endTime: Date;
  capacity: number;
}): SlotCapacity {
  if (endTime.getTime() <= startTime.getTime()) {
    throw new Error("Slot end time must be after start time");
  }

  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new Error("Capacity must be a positive integer");
  }

  const occupied = appointments.filter((appointment) => {
    const active =
      appointment.status === "PENDING" ||
      appointment.status === "CONFIRMED";

    const overlaps =
      appointment.startTime.getTime() < endTime.getTime() &&
      appointment.endTime.getTime() > startTime.getTime();

    return active && overlaps;
  }).length;

  return {
    occupied,
    capacity,
    availableBookings: Math.max(0, capacity - occupied),
    isAvailable: occupied < capacity,
  };
}
