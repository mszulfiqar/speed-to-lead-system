"use client";

import { useEffect, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Lead = {
  service: string | null;
  problem: string | null;
  urgency: "LOW" | "MEDIUM" | "HIGH" | null;
  propertyType:
    | "RESIDENTIAL"
    | "COMMERCIAL"
    | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  preferredTime: string | null;
};

type JevDecision = {
  shouldExtract: boolean;
  shouldHandoff: boolean;
  isAppointmentRequest: boolean;
  isEmergency: boolean;
};

type SerializedMessage = {
  id?: string[];
  type?: string;
  role?: string;
  content?: unknown;

  kwargs?: {
    content?: unknown;
  };
};

type TestState = {
  messages: SerializedMessage[];

  lead: Lead | null;

  jevDecision: JevDecision | null;

  conversationStatus:
    | "AI_ACTIVE"
    | "WAITING_FOR_HUMAN"
    | "HUMAN_ACTIVE"
    | "CLOSED";

  appointmentStatus:
    | "NONE"
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED";

  action:
    | "CONTINUE"
    | "HANDOFF"
    | "TOOL"
    | null;
};

/*
 * Get the actual message content from
 * LangChain's serialized message format.
 *
 * Example:
 *
 * {
 *   id: ["langchain_core", "messages", "AIMessage"],
 *   kwargs: {
 *     content: "Hello..."
 *   }
 * }
 */
function getMessageText(
  message: SerializedMessage
): string {
  const content =
    message.kwargs?.content ??
    message.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (
          typeof item === "string"
        ) {
          return item;
        }

        if (
          typeof item === "object" &&
          item !== null &&
          "text" in item
        ) {
          return String(
            (item as { text: unknown })
              .text
          );
        }

        return "";
      })
      .filter(Boolean)
      .join("");
  }

  if (
    content !== null &&
    content !== undefined
  ) {
    return JSON.stringify(content);
  }

  return "";
}

/*
 * Detect LangChain HumanMessage.
 */
function isHumanMessage(
  message: SerializedMessage
): boolean {
  if (
    Array.isArray(message.id) &&
    message.id.includes("HumanMessage")
  ) {
    return true;
  }

  return (
    message.type === "human" ||
    message.role === "user"
  );
}

/*
 * Detect LangChain AIMessage.
 */
function isAIMessage(
  message: SerializedMessage
): boolean {
  if (
    Array.isArray(message.id) &&
    message.id.includes("AIMessage")
  ) {
    return true;
  }

  return (
    message.type === "ai" ||
    message.role === "assistant"
  );
}

export default function AITestPage() {
  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [state, setState] =
    useState<TestState | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [sessionId, setSessionId] =
    useState<string | null>(null);

  /*
   * Create the test session only
   * on the client.
   *
   * This avoids hydration mismatch.
   */
  useEffect(() => {
    setSessionId(
      `test-${crypto.randomUUID()}`
    );
  }, []);

  async function sendMessage() {
    const trimmed =
      message.trim();

    if (
      !trimmed ||
      loading ||
      !sessionId
    ) {
      return;
    }

    /*
     * Show the human message
     * immediately.
     */
    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: trimmed,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/test/ai",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            sessionId,
            message: trimmed,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Something went wrong"
        );
      }

      const result =
        data.state as TestState;

      /*
       * Update the state panel.
       */
      setState(result);

      /*
       * The API returns the complete
       * LangChain conversation.
       *
       * Example:
       *
       * [
       *   HumanMessage,
       *   AIMessage,
       *   HumanMessage,
       *   AIMessage
       * ]
       *
       * Rebuild the UI from that
       * complete history.
       */
      const serializedMessages =
        Array.isArray(result.messages)
          ? result.messages
          : [];

      const uiMessages: Message[] =
        serializedMessages
          .map((item) => {
            const content =
              getMessageText(item).trim();

            if (!content) {
              return null;
            }

            if (
              isHumanMessage(item)
            ) {
              return {
                role: "user" as const,
                content,
              };
            }

            if (
              isAIMessage(item)
            ) {
              return {
                role:
                  "assistant" as const,
                content,
              };
            }

            return null;
          })
          .filter(
            (
              item
            ): item is Message =>
              item !== null
          );

      /*
       * Replace the optimistic UI with
       * the authoritative complete
       * conversation from the backend.
       */
      setMessages(uiMessages);
    } catch (error) {
      console.error(
        "AI Test error:",
        error
      );

      /*
       * Keep the human message visible
       * and show an error message.
       */
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Something went wrong while running the AI test.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function resetTest() {
    if (!sessionId) {
      return;
    }

    try {
      await fetch(
        "/api/test/ai",
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            sessionId,
          }),
        }
      );
    } catch (error) {
      console.error(
        "Failed to reset test:",
        error
      );
    }

    setMessages([]);
    setState(null);
    setMessage("");
  }

  const lead = state?.lead;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              AI Test Lab
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Test the HVAC AI conversation
              without touching the production
              database.
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              Simulation
            </div>

            <button
              onClick={resetTest}
              disabled={
                !sessionId ||
                loading
              }
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset Test
            </button>

          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

          {/* Conversation */}
          <div className="flex h-[calc(100vh-150px)] min-h-[600px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            {/* Conversation header */}
            <div className="border-b border-slate-200 px-5 py-4">

              <p className="font-medium">
                Test Conversation
              </p>

              <p className="text-xs text-slate-500">
                Session:{" "}
                {sessionId ??
                  "Creating session..."}
              </p>

            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5">

              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-center">

                  <div>
                    <p className="font-medium text-slate-700">
                      Start a conversation
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Try:{" "}
                      &quot;My AC stopped
                      working&quot;
                    </p>
                  </div>

                </div>
              )}

              {messages.map(
                (item, index) => (
                  <div
                    key={`${index}-${item.role}`}
                    className={`flex ${
                      item.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`max-w-[75%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm ${
                        item.role === "user"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {item.content}
                    </div>

                  </div>
                )
              )}

              {loading && (
                <div className="flex justify-start">

                  <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                    AI is thinking...
                  </div>

                </div>
              )}

            </div>

            {/* Composer */}
            <div className="border-t border-slate-200 p-4">

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage();
                }}
                className="flex gap-3"
              >

                <input
                  value={message}
                  onChange={(event) =>
                    setMessage(
                      event.target.value
                    )
                  }
                  placeholder="Type a customer message..."
                  disabled={
                    loading ||
                    !sessionId
                  }
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !message.trim() ||
                    !sessionId
                  }
                  className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Sending..."
                    : "Send"}
                </button>

              </form>

            </div>

          </div>

          {/* State panel */}
          <div className="space-y-4">

            {/* Conversation State */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

              <h2 className="font-semibold">
                Conversation State
              </h2>

              <div className="mt-4 space-y-3 text-sm">

                <StateRow
                  label="Status"
                  value={
                    state?.conversationStatus ??
                    "AI_ACTIVE"
                  }
                />

                <StateRow
                  label="Action"
                  value={
                    state?.action ?? "—"
                  }
                />

              </div>

            </div>

            {/* Jev */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

              <h2 className="font-semibold">
                Jev Decision
              </h2>

              <div className="mt-4 space-y-3 text-sm">

                <BooleanRow
                  label="Should Extract"
                  value={
                    state?.jevDecision
                      ?.shouldExtract
                  }
                />

                <BooleanRow
                  label="Should Handoff"
                  value={
                    state?.jevDecision
                      ?.shouldHandoff
                  }
                />

                <BooleanRow
                  label="Appointment Request"
                  value={
                    state?.jevDecision
                      ?.isAppointmentRequest
                  }
                />

                <BooleanRow
                  label="Emergency"
                  value={
                    state?.jevDecision
                      ?.isEmergency
                  }
                />

              </div>

            </div>

            {/* Lead */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

              <h2 className="font-semibold">
                Lead State
              </h2>

              <div className="mt-4 space-y-2 text-sm">

                <StateRow
                  label="Service"
                  value={
                    lead?.service ?? "—"
                  }
                />

                <StateRow
                  label="Problem"
                  value={
                    lead?.problem ?? "—"
                  }
                />

                <StateRow
                  label="Urgency"
                  value={
                    lead?.urgency ?? "—"
                  }
                />

                <StateRow
                  label="Property"
                  value={
                    lead?.propertyType ??
                    "—"
                  }
                />

                <StateRow
                  label="Address"
                  value={
                    lead?.address ?? "—"
                  }
                />

                <StateRow
                  label="City"
                  value={
                    lead?.city ?? "—"
                  }
                />

                <StateRow
                  label="State"
                  value={
                    lead?.state ?? "—"
                  }
                />

                <StateRow
                  label="ZIP"
                  value={
                    lead?.zipCode ?? "—"
                  }
                />

                <StateRow
                  label="Preferred Time"
                  value={
                    lead?.preferredTime ??
                    "—"
                  }
                />

              </div>

            </div>

            {/* Appointment */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

              <h2 className="font-semibold">
                Appointment
              </h2>

              <div className="mt-4">

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                  {state?.appointmentStatus ??
                    "NONE"}
                </span>

              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

function StateRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">

      <span className="text-slate-500">
        {label}
      </span>

      <span className="max-w-[220px] break-words text-right font-medium">
        {value}
      </span>

    </div>
  );
}

function BooleanRow({
  label,
  value,
}: {
  label: string;
  value: boolean | undefined;
}) {
  return (
    <div className="flex items-center justify-between">

      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-medium">
        {value === undefined
          ? "—"
          : value
            ? "YES"
            : "NO"}
      </span>

    </div>
  );
}