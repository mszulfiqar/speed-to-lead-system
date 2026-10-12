import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "TEST_DATABASE_URL is required for integration tests.",
  );
}

if (!connectionString.includes("-pooler.")) {
  console.warn(
    "The test database URL does not appear to use a Neon pooler hostname. Verify the target database manually.",
  );
}

export const testDb = drizzle({
  connection: {
    connectionString,
    ssl: true,
  },
});