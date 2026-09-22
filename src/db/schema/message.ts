import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { conversations } from "./conversation";

export const messageSenderTypeEnum = pgEnum(
  "message_sender_type",
  [
    "CUSTOMER",
    "AI",
    "HUMAN",
  ]
);

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),

  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, {
      onDelete: "cascade",
    }),

  senderType: messageSenderTypeEnum("sender_type")
    .notNull(),

  content: text("content").notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});