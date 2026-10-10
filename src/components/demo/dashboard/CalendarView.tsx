"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Appointment = {
  id: string;
  leadId: string;
  customerName: string | null;
  phone: string | null;
  service: string | null;
  startTime: string;
  endTime: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED"
    | "COMPLETED"
    | "NO_SHOW";
};

type CalendarResponse = {
  appointments: Appointment[];
};

async function fetchCalendar(
  sessionId: string
): Promise<CalendarResponse> {
  const response = await fetch(
    `/api/demo/calendar?sessionId=${sessionId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to load calendar"
    );
  }

  return data;
}

export default function CalendarView({
  sessionId,
}: {
  sessionId: string;
}) {
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "demo-calendar",
      sessionId,
    ],

    queryFn: () =>
      fetchCalendar(sessionId),

    enabled: Boolean(sessionId),

    refetchInterval: 3000,
  });

  const appointments =
    data?.appointments ?? [];

  /*
   * Sort appointments by start time.
   */
  const sortedAppointments = [
    ...appointments,
  ].sort(
    (a, b) =>
      new Date(
        a.startTime
      ).getTime() -
      new Date(
        b.startTime
      ).getTime()
  );

  /*
   * Loading
   */
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <PageHeader />

        <Card>
          <CardContent className="flex min-h-[400px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Loading calendar...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /*
   * Error
   */
  if (isError) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <PageHeader />

        <Card className="border-red-200">
          <CardContent className="flex min-h-[300px] items-center justify-center">
            <p className="text-sm text-red-600">
              Failed to load calendar.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader />

      {/* Calendar summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total appointments"
          value={appointments.length}
          icon={
            <CalendarDays className="size-4" />
          }
        />

        <SummaryCard
          label="Pending"
          value={
            appointments.filter(
              (appointment) =>
                appointment.status ===
                "PENDING"
            ).length
          }
          icon={
            <Clock3 className="size-4" />
          }
        />

        <SummaryCard
          label="Confirmed"
          value={
            appointments.filter(
              (appointment) =>
                appointment.status ===
                "CONFIRMED"
            ).length
          }
          icon={
            <CheckCircle2 className="size-4" />
          }
        />
      </div>

      {/* Appointment list */}
      <Card className="overflow-hidden">
        <div className="border-b px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Appointments
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                View scheduled and pending customer appointments.
              </p>
            </div>

            <Badge
              variant="secondary"
              className="shrink-0"
            >
              {appointments.length}{" "}
              {appointments.length === 1
                ? "appointment"
                : "appointments"}
            </Badge>
          </div>
        </div>

        {sortedAppointments.length ===
        0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y">
            {sortedAppointments.map(
              (appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={
                    appointment
                  }
                />
              )
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

/*
 * Page header
 */
function PageHeader() {
  return (
    <div className="mb-8">
      <p className="mb-2 text-sm font-medium text-emerald-600">
        Scheduling
      </p>

      <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
        Calendar
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        Manage customer appointments and booking requests.
      </p>
    </div>
  );
}

/*
 * Summary card
 */
function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>

          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/*
 * Appointment row
 */
function AppointmentRow({
  appointment,
}: {
  appointment: Appointment;
}) {
  const start =
    new Date(
      appointment.startTime
    );

  const end =
    new Date(
      appointment.endTime
    );

  const isPending =
    appointment.status ===
    "PENDING";

  return (
    <div className="flex flex-col gap-5 px-6 py-5 transition hover:bg-slate-50/70 lg:flex-row lg:items-center lg:justify-between">
      {/* Left */}
      <div className="flex min-w-0 gap-4">
        {/* Date */}
        <div className="hidden w-14 shrink-0 flex-col items-center justify-center rounded-lg border bg-slate-50 py-2 sm:flex">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {start.toLocaleDateString(
              "en-US",
              {
                month: "short",
              }
            )}
          </span>

          <span className="text-xl font-semibold text-slate-950">
            {start.getDate()}
          </span>

          <span className="text-[10px] text-muted-foreground">
            {start.toLocaleDateString(
              "en-US",
              {
                weekday: "short",
              }
            )}
          </span>
        </div>

        {/* Details */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-950">
              {appointment.customerName ||
                "Unknown Customer"}
            </h3>

            <StatusBadge
              status={
                appointment.status
              }
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" />

              {formatTime(start)} –{" "}
              {formatTime(end)}
            </span>

            {appointment.service && (
              <span>
                {appointment.service}
              </span>
            )}
          </div>

          {appointment.phone && (
            <p className="mt-2 text-xs text-muted-foreground">
              {appointment.phone}
            </p>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex shrink-0 items-center gap-2">
        {isPending && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <Clock3 className="size-3.5 text-amber-600" />

            <span className="text-xs font-medium text-amber-700">
              Awaiting approval
            </span>
          </div>
        )}

        {appointment.status ===
          "CONFIRMED" && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="size-3.5 text-emerald-600" />

            <span className="text-xs font-medium text-emerald-700">
              Confirmed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/*
 * Status badge
 */
function StatusBadge({
  status,
}: {
  status: Appointment["status"];
}) {
  if (status === "PENDING") {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-[10px] font-medium uppercase tracking-wider text-amber-700"
      >
        Pending
      </Badge>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-[10px] font-medium uppercase tracking-wider text-emerald-700"
      >
        Confirmed
      </Badge>
    );
  }

  if (status === "CANCELLED") {
    return (
      <Badge
        variant="outline"
        className="border-red-200 bg-red-50 text-[10px] font-medium uppercase tracking-wider text-red-700"
      >
        Cancelled
      </Badge>
    );
  }

  if (status === "COMPLETED") {
    return (
      <Badge
        variant="outline"
        className="border-slate-200 bg-slate-50 text-[10px] font-medium uppercase tracking-wider text-slate-700"
      >
        Completed
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-[10px] font-medium uppercase tracking-wider"
    >
      {status.replaceAll(
        "_",
        " "
      )}
    </Badge>
  );
}

/*
 * Empty state
 */
function EmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100">
        <CalendarDays className="size-5 text-slate-500" />
      </div>

      <h3 className="text-sm font-semibold text-slate-950">
        No appointments yet
      </h3>

      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        When customers request appointments, they will appear here.
      </p>
    </div>
  );
}

/*
 * Format appointment time
 */
function formatTime(
  date: Date
) {
  return date.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}
