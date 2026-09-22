import {
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { businesses } from "./business";
import { customers } from "./customer";
import { leads } from "./lead";
import { phoneNumbers } from "./phone-number";

export const conversationChannelEnum = pgEnum(
  "conversation_channel",
  [
    "SMS",
    "WEB_CHAT",
  ]
);

export const conversationStatusEnum = pgEnum(
  "conversation_status",
  [
    "AI_ACTIVE",
    "HUMAN_ACTIVE",
    "WAITING_FOR_HUMAN",
    "CLOSED",
  ]
);

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),

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

  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, {
      onDelete: "cascade",
    }),

  phoneNumberId: uuid("phone_number_id")
    .references(() => phoneNumbers.id),

  channel: conversationChannelEnum("channel")
    .notNull(),

  status: conversationStatusEnum("status")
    .notNull()
    .default("AI_ACTIVE"),

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