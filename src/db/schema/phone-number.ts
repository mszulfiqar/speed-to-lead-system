import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { businesses } from "./business";

export const phoneNumberProviderEnum = pgEnum(
  "phone_number_provider",
  ["TWILIO", "TELNYX"]
);

export const phoneNumberTypeEnum = pgEnum(
  "phone_number_type",
  ["SMS", "VOICE", "BOTH"]
);

export const phoneNumberStatusEnum = pgEnum(
  "phone_number_status",
  ["ACTIVE", "INACTIVE"]
);

export const phoneNumbers = pgTable("phone_numbers", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, {
      onDelete: "cascade",
    }),
  number: text("number").notNull(),
  provider: phoneNumberProviderEnum("provider").notNull(),
  type: phoneNumberTypeEnum("type").notNull(),
  status: phoneNumberStatusEnum("status")
    .notNull()
    .default("ACTIVE"),
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