"use client";

import { useSearchParams } from "next/navigation";

import ConversationsView from "@/components/demo/dashboard/ConversationsView";

export default function ConversationsPage() {
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("sessionId");
  const conversationId =
    searchParams.get("conversationId");

  if (!sessionId) {
    return (
      <div className="rounded-lg border border-red-200 bg-white p-6">
        <p className="text-sm text-red-600">
          Missing demo session.
        </p>
      </div>
    );
  }

  return (
    <ConversationsView
      sessionId={sessionId}
      conversationId={conversationId}
    />
  );
}
