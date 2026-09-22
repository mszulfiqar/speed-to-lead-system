import { pgEnum } from "drizzle-orm/pg-core";

export const leadSourceEnum = pgEnum("lead_source", [
  "WEBSITE",
  "GOOGLE_ADS",
  "FACEBOOK",
  "INSTAGRAM",
  "YELP",
  "GOOGLE_BUSINESS",
  "THUMBTACK",
  "HOMEADVISOR",
  "ANGI",
  "MANUAL_PHONE",
]);

export const leadStatusEnum = pgEnum(
  "lead_status",
  [
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "WAITING_FOR_HUMAN",
    "BOOKED",
    "LOST",
    "CLOSED",
  ]
);

export const leadUrgencyEnum = pgEnum(
  "lead_urgency",
  [
    "LOW",
    "MEDIUM",
    "HIGH",
  ]
);