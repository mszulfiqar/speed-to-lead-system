import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { db } from "@/db";
import { demoSessions } from "@/db/schema/demo-session";

const sourceMap = {
  website: "WEBSITE",
  "google-ads": "GOOGLE_ADS",
  facebook: "FACEBOOK",
  instagram: "INSTAGRAM",
  yelp: "YELP",
  "google-business": "GOOGLE_BUSINESS",
  thumbtack: "THUMBTACK",
  homeadvisor: "HOMEADVISOR",
  angi: "ANGI",
  manual: "MANUAL_PHONE",
} as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const source = body.source;

    if (
      typeof source !== "string" ||
      !(source in sourceMap)
    ) {
      return NextResponse.json(
        { error: "Invalid lead source" },
        { status: 400 }
      );
    }

    const databaseSource =
      sourceMap[source as keyof typeof sourceMap];

    const sessionToken = randomBytes(32).toString("hex");

    const [session] = await db
      .insert(demoSessions)
      .values({
        source: databaseSource,
        sessionToken,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      })
      .returning({
        id: demoSessions.id,
      });

    const response = NextResponse.json({
      sessionId: session.id,
      source,
    });

    response.cookies.set("demo_session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30,
    });

    return response;
  } catch (error) {
    console.error("Failed to create demo session:", error);

    return NextResponse.json(
      { error: "Failed to create demo session" },
      { status: 500 }
    );
  }
}