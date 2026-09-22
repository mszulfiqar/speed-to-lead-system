import "dotenv/config";

import { db } from "./index";
import { businesses } from "./schema/business";

async function seed() {
  console.log("🌱 Starting database seed...");

  const [business] = await db
    .insert(businesses)
    .values({
      name: "Demo HVAC Company",
      email: "demo@example.com",
      website: "https://example.com",
      timezone: "America/Chicago",
    })
    .returning();

  console.log("✅ Demo business created:");
  console.log(business);

  console.log("🌱 Seed completed!");
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });