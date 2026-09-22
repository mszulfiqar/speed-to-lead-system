import {
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { businesses } from "./business";
import { customers } from "./customer";
import { leads } from "./lead";

export const appointmentStatusEnum = pgEnum(
  "appointment_status",
  [
    "PENDING",
    "CONFIRMED",
    "CANCELLED",
    "COMPLETED",
    "NO_SHOW",
  ]
);

export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),

  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, {
      onDelete: "cascade",
    }),

  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, {
      onDelete: "cascade",
    }),

  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, {
      onDelete: "cascade",
    }),

  startTime: timestamp("start_time", {
    withTimezone: true,
  }).notNull(),

  endTime: timestamp("end_time", {
    withTimezone: true,
  }).notNull(),

  status: appointmentStatusEnum("status")
    .notNull()
    .default("PENDING"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});