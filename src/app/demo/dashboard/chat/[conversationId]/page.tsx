
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type Message = {
  id: string;
  senderType: "CUSTOMER" | "AI" | "HUMAN";
  content: string;
  createdAt: string;
};

type ConversationData = {
  conversation: {
    id: string;
    status: string;
  };
  messages: Message[];
};

export default function DashboardChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const conversationId =
    params.conversationId as string;

  const sessionId =
    searchParams.get("sessionId");

  const [data, setData] =
    useState<ConversationData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadConversation() {
      if (!conversationId || !sessionId) {
        setError("Missing conversation or session ID.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/demo/chat/${conversationId}?sessionId=${sessionId}`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Failed to load conversation"
          );
        }

        setData(result);
      } catch (error) {
        console.error(
          "Failed to load conversation:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load conversation"
        );
      } finally {
        setLoading(false);
      }
    }

    loadConversation();
  }, [conversationId, sessionId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-gray-500">
            Loading conversation...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Conversation
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {conversationId}
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {data.conversation.status}
          </span>
        </div>

        {/* Messages */}
        <div className="rounded-xl border bg-white">
          <div className="divide-y">
            {data.messages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No messages yet.
              </div>
            ) : (
              data.messages.map((message) => (
                <div
                  key={message.id}
                  className="p-5"
                >
                  <div className="mb-2 text-xs font-semibold uppercase text-gray-400">
                    {message.senderType}
                  </div>

                  <p className="whitespace-pre-wrap text-gray-900">
                    {message.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
