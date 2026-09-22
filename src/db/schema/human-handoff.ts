import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { conversations } from "./conversation";

export const handoffStatusEnum = pgEnum(
  "handoff_status",
  [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "RESOLVED",
  ]
);

export const humanHandoffs = pgTable("human_handoffs", {
  id: uuid("id").defaultRandom().primaryKey(),

  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, {
      onDelete: "cascade",
    }),

  reason: text("reason").notNull(),

  status: handoffStatusEnum("status")
    .notNull()
    .default("PENDING"),

  assignedTo: text("assigned_to"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  resolvedAt: timestamp("resolved_at", {
    withTimezone: true,
  }),
});