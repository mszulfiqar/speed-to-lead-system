// import { db } from "@/db";
// import { demoSessions } from "@/db/schema/demo-session";
// import { eq } from "drizzle-orm";
// import { cookies } from "next/headers";
// // import { eq } from "drizzle-orm";

// // import { cookies } from "next/dist/server/request/cookies";

// // import { db } from "@/db";
// // import { demoSessions } from "@/db/schema/demo-session";

// // export async function getDemoSession(sessionId: string) {
// //   const cookieStore = await cookies();

// //   const sessionToken = cookieStore.get("demo_session_token")?.value;

// //   if (!sessionToken) {
// //     return null;
// //   }

// //   const [session] = await db
// //     .select()
// //     .from(demoSessions)
// //     .where(eq(demoSessions.id, sessionId))
// //     .limit(1);

// //   if (!session) {
// //     return null;
// //   }

// //   if (session.sessionToken !== sessionToken) {
// //     return null;
// //   }

// //   if (session.status !== "ACTIVE") {
// //     return null;
// //   }

// //   if (
// //     session.expiresAt &&
// //     session.expiresAt.getTime() < Date.now()
// //   ) {
// //     return null;
// //   }

// //   return session;
// // }



// export async function getDemoSession(sessionId: string) {
//   const cookieStore = await cookies();

//   const sessionToken =
//     cookieStore.get("demo_session_token")?.value;

//   console.log("🔐 SESSION CHECK");
//   console.log("sessionId:", sessionId);
//   console.log("cookie token exists:", !!sessionToken);

//   if (!sessionToken) {
//     console.log("❌ No session cookie");
//     return null;
//   }

//   const [session] = await db
//     .select()
//     .from(demoSessions)
//     .where(eq(demoSessions.id, sessionId))
//     .limit(1);

//   console.log("DB session exists:", !!session);

//   if (!session) {
//     console.log("❌ Session not found in DB");
//     return null;
//   }

//   console.log(
//     "Token matches:",
//     session.sessionToken === sessionToken
//   );

//   console.log("Session status:", session.status);
//   console.log("Session expired:", 
//     session.expiresAt
//       ? session.expiresAt.getTime() < Date.now()
//       : false
//   );

//   if (session.sessionToken !== sessionToken) {
//     return null;
//   }

//   if (session.status !== "ACTIVE") {
//     return null;
//   }

//   if (
//     session.expiresAt &&
//     session.expiresAt.getTime() < Date.now()
//   ) {
//     return null;
//   }

//   return session;
// }
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
