import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { demoSessions } from "@/db/schema/demo-session";

export async function getDemoSession(
  sessionId: string
) {
  const cookieStore = await cookies();

  const sessionToken =
    cookieStore.get("demo_session_token")?.value;

  // No cookie = no valid demo session
  if (!sessionToken) {
    return null;
  }

  // Find session
  const [session] = await db
    .select()
    .from(demoSessions)
    .where(eq(demoSessions.id, sessionId))
    .limit(1);

  // Session doesn't exist
  if (!session) {
    return null;
  }

  // Token doesn't belong to this browser
  if (session.sessionToken !== sessionToken) {
    return null;
  }

  // Session was already completed/expired
  if (session.status !== "ACTIVE") {
    return null;
  }

  // Check database expiration
  if (
    session.expiresAt &&
    session.expiresAt.getTime() <= Date.now()
  ) {
    console.log(
      "⏰ Demo session expired:",
      session.id
    );

    // Mark session as expired in DB
    await db
      .update(demoSessions)
      .set({
        status: "EXPIRED",
      })
      .where(
        eq(demoSessions.id, session.id)
      );

    // Delete expired browser cookie
    cookieStore.delete("demo_session_token");

    return null;
  }

  return session;
}
