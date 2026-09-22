import { NextResponse } from "next/server";
import { agent } from "@/lib/ai/agent";

export async function GET() {
  try {
    const result = await agent.invoke(
      {
        messages: [
          {
            role: "user",
            content: "My AC stopped working",
          },
        ],
      },
      {
        configurable: {
          thread_id: "test-thread-1",
        },
      }
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Agent test error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Agent failed",
      },
      { status: 500 }
    );
  }
}