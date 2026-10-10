import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { businesses } from "./business";
import { customers } from "./customer";

import {
  leadSourceEnum,
  leadStatusEnum,
  leadUrgencyEnum,
} from "./enums";

import { demoSessions } from "./demo-session";

export const propertyTypeEnum = pgEnum("property_type", [
  "RESIDENTIAL",
  "COMMERCIAL",
]);

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),

  demoSessionId: uuid("demo_session_id").references(
    () => demoSessions.id,
    {
      onDelete: "set null",
    }
  ),

  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, {
      onDelete: "cascade",
    }),

  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, {
      onDelete: "cascade",
    }),

  source: leadSourceEnum("source").notNull(),

  status: leadStatusEnum("status")
    .notNull()
    .default("NEW"),

  service: text("service"),

  problem: text("problem"),

  urgency: leadUrgencyEnum("urgency"),

  propertyType: propertyTypeEnum("property_type"),

  address: text("address"),

  city: text("city"),

  state: text("state"),

  zipCode: text("zip_code"),

  preferredTime: text("preferred_time"),

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