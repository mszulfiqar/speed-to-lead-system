import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { leadSourceEnum } from "./enums";

export const demoSessionStatusEnum = pgEnum(
  "demo_session_status",
  [
    "ACTIVE",
    "COMPLETED",
    "EXPIRED",
  ]
);

export const demoSessions = pgTable("demo_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  source: leadSourceEnum("source").notNull(),
  status: demoSessionStatusEnum("status")
    .notNull()
    .default("ACTIVE"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
  }),
});