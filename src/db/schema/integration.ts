import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { businesses } from "./business";

export const integrationTypeEnum = pgEnum(
  "integration_type",
  [
    "SMS",
    "CALENDAR",
    "CRM",
  ]
);

export const integrationProviderEnum = pgEnum(
  "integration_provider",
  [
    "TWILIO",
    "TELNYX",
    "GOOGLE_CALENDAR",
    "HUBSPOT",
    "SALESFORCE",
  ]
);

export const integrationStatusEnum = pgEnum(
  "integration_status",
  [
    "ACTIVE",
    "INACTIVE",
    "ERROR",
  ]
);

export const integrations = pgTable("integrations", {
  id: uuid("id").defaultRandom().primaryKey(),

  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, {
      onDelete: "cascade",
    }),

  type: integrationTypeEnum("type").notNull(),

  provider: integrationProviderEnum("provider").notNull(),

  status: integrationStatusEnum("status")
    .notNull()
    .default("ACTIVE"),

  credentials: text("credentials"),

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