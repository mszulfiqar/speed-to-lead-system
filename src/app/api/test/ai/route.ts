import { NextResponse } from "next/server";

import {
  getAITest,
  resetAITest,
  runAITest,
} from "@/lib/ai/test/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sessionId =
      typeof body.sessionId === "string"
        ? body.sessionId
        : null;

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const result = await runAITest(sessionId, message);

    return NextResponse.json({
      success: true,
      state: result,
    });
  } catch (error) {
    console.error("❌ AI Test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "AI test failed",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  const state = getAITest(sessionId);

  return NextResponse.json({
    success: true,
    state,
  });
}

export async function DELETE(request: Request) {
  const body = await request.json();

  const sessionId =
    typeof body.sessionId === "string"
      ? body.sessionId
      : null;

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  resetAITest(sessionId);

  return NextResponse.json({
    success: true,
  });
}