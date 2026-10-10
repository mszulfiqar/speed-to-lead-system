
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
  propertyType: "RESIDENTIAL" | "COMMERCIAL" | null;
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
  isMeaningfulResponse?: boolean;
  isSpam?: boolean;
  bookingReadiness?: "READY" | "NOT_READY" | "UNKNOWN" | null;
};

type SerializedMessage = {
  type?: string;
  role?: string;
  content?: unknown;
  kwargs?: {
    content?: unknown;
  };
};

type TestState = {
  messages?: SerializedMessage[];
  lead?: Partial<Lead>;
  jevDecision?: Partial<JevDecision>;

  conversationStatus?:
    | "AI_ACTIVE"
    | "WAITING_FOR_HUMAN"
    | "HUMAN_ACTIVE"
    | "CLOSED";

  appointmentStatus?:
    | "NONE"
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED";

  action?: "CONTINUE" | "HANDOFF" | "TOOL" | null;

  // Optional diagnostic fields.
  // These appear when the API returns them.
  bookingReadiness?: "READY" | "NOT_READY" | "UNKNOWN" | null;
  currentGoal?: "GENERAL" | "QUALIFY" | "APPOINTMENT" | "HUMAN" | "CLOSED";
  unclearCount?: number;
  lowIntent?: boolean;
  lastQuestion?: string | null;
  handoffReason?: string | null;
  pendingTool?: string | null;
  toolResult?: unknown;
  appointmentRequested?: boolean;
  isEmergency?: boolean;
  isSpam?: boolean;
  isMeaningfulResponse?: boolean;
};

function getMessageText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;

        if (
          item &&
          typeof item === "object" &&
          "text" in item &&
          typeof item.text === "string"
        ) {
          return item.text;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  if (content && typeof content === "object" && "text" in content) {
    const text = (content as { text?: unknown }).text;
    return typeof text === "string" ? text : "";
  }

  return "";
}

function isHumanMessage(message: SerializedMessage): boolean {
  return (
    message.type === "human" ||
    message.type === "HumanMessage" ||
    message.role === "user"
  );
}

function isAIMessage(message: SerializedMessage): boolean {
  return (
    message.type === "ai" ||
    message.type === "AIMessage" ||
    message.role === "assistant"
  );
}

function displayBoolean(value: boolean | undefined | null): string {
  if (value === undefined || value === null) return "—";
  return value ? "true" : "false";
}

function displayValue(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatLabel(value: string | null | undefined): string {
  if (!value) return "—";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function StateCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>

      <div className="space-y-3 p-4">{children}</div>
    </section>
  );
}

function StateRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
        {label}
      </span>

      <span className="max-w-[65%] whitespace-pre-wrap break-words text-right text-xs font-medium text-gray-900 dark:text-gray-100">
        {displayValue(value)}
      </span>
    </div>
  );
}

function StatusBadge({ value }: { value: string | null | undefined }) {
  const status = value ?? "UNKNOWN";

  const styles: Record<string, string> = {
    AI_ACTIVE:
      "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    WAITING_FOR_HUMAN:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    HUMAN_ACTIVE:
      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    CLOSED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    PENDING:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    CONFIRMED:
      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    NONE: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    READY: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    NOT_READY:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    UNKNOWN: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] ?? styles.UNKNOWN
      }`}
    >
      {formatLabel(status)}
    </span>
  );
}

export default function AITestPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<TestState | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    setSessionId(`test-${crypto.randomUUID()}`);
  }, []);

  async function sendMessage() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || !sessionId || loading) return;

    const userMessage: Message = {
      role: "user",
      content: trimmedMessage,
    };

    setMessages((previous) => [...previous, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/test/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message: trimmedMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      const result = data.state as TestState | undefined;

      if (result) {
        setState(result);

        if (Array.isArray(result.messages)) {
          const chatMessages: Message[] = result.messages
            .map((item): Message | null => {
              const content = getMessageText(
                item.content ?? item.kwargs?.content,
              );

              if (!content.trim()) return null;

              if (isHumanMessage(item)) {
                return { role: "user", content };
              }

              if (isAIMessage(item)) {
                return { role: "assistant", content };
              }

              return null;
            })
            .filter((item): item is Message => item !== null);

          setMessages(chatMessages);
        } else if (typeof data.reply === "string" && data.reply.trim()) {
          setMessages((previous) => [
            ...previous,
            { role: "assistant", content: data.reply },
          ]);
        }
      } else if (typeof data.reply === "string" && data.reply.trim()) {
        setMessages((previous) => [
          ...previous,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch (error) {
      console.error("AI Test Lab error:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `Error: ${error.message}`
              : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function resetTest() {
    if (loading) return;

    try {
      if (sessionId) {
        await fetch("/api/test/ai", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });
      }
    } catch (error) {
      console.error("Failed to reset test session:", error);
    }

    setMessages([]);
    setState(null);
    setMessage("");
    setSessionId(`test-${crypto.randomUUID()}`);
  }

  const lead = state?.lead;
  const jev = state?.jevDecision;

  const conversationStatus = state?.conversationStatus;
  const appointmentStatus = state?.appointmentStatus ?? "NONE";

  const bookingReadiness =
    state?.bookingReadiness ?? jev?.bookingReadiness;

  const isEmergency = state?.isEmergency ?? jev?.isEmergency;
  const isSpam = state?.isSpam ?? jev?.isSpam;

  const isMeaningfulResponse =
    state?.isMeaningfulResponse ?? jev?.isMeaningfulResponse;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-[1800px] p-4 sm:p-6">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                AI Test Lab
              </h1>

              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
                Simulation
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Test the HVAC agent and inspect its internal state.
            </p>
          </div>

          <button
            type="button"
            onClick={resetTest}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            Reset Test
          </button>
        </header>

        {/* Main layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Chat */}
          <section className="flex h-[calc(100vh-150px)] min-h-[600px] min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h2 className="font-semibold">Conversation</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Send customer messages to test the agent.
              </p>
            </div>

            {/* Message history */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {messages.length === 0 && (
                <div className="flex h-full min-h-[250px] flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl dark:bg-blue-950">
                    💬
                  </div>

                  <h3 className="font-medium">Start a test conversation</h3>

                  <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                    Try a normal HVAC request, an emergency, spam, or an
                    appointment request.
                  </p>
                </div>
              )}

              {messages.map((item, index) => {
                const isUser = item.role === "user";

                return (
                  <div
                    key={`${index}-${item.role}`}
                    className={`flex ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${
                        isUser
                          ? "rounded-br-md bg-blue-600 text-white"
                          : "rounded-bl-md bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                      }`}
                    >
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        {isUser ? "Customer" : "AI Agent"}
                      </div>

                      {item.content}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    Agent is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Message input */}
            <form
              className="border-t border-gray-200 p-4 dark:border-gray-800"
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage();
              }}
            >
              <div className="flex items-end gap-3">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Type a customer message..."
                  rows={2}
                  disabled={loading || !sessionId}
                  className="max-h-36 min-h-[48px] flex-1 resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-blue-950"
                />

                <button
                  type="submit"
                  disabled={loading || !message.trim() || !sessionId}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Enter to send · Shift + Enter for a new line
              </p>
            </form>
          </section>

          {/* Live state sidebar */}
          <aside className="min-h-0 space-y-4 lg:max-h-[calc(100vh-150px)] lg:overflow-y-auto lg:pr-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Live State Inspector</h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Updates after each response.
                </p>
              </div>

              <span className="rounded-md border border-gray-200 px-2 py-1 text-[10px] font-medium text-gray-500 dark:border-gray-800">
                READ ONLY
              </span>
            </div>

            {/* Conversation */}
            <StateCard title="Conversation State">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Status
                </span>
                <StatusBadge value={conversationStatus} />
              </div>

              <StateRow label="Action" value={state?.action} />
              <StateRow
                label="Current goal"
                value={formatLabel(state?.currentGoal)}
              />
              <StateRow
                label="Low intent"
                value={displayBoolean(state?.lowIntent)}
              />
              <StateRow
                label="Unclear count"
                value={state?.unclearCount}
              />
              <StateRow label="Last question" value={state?.lastQuestion} />
              <StateRow label="Handoff reason" value={state?.handoffReason} />
            </StateCard>

            {/* Jev */}
            <StateCard title="Jev Decision">
              <StateRow
                label="Meaningful response"
                value={displayBoolean(isMeaningfulResponse)}
              />
              <StateRow label="Spam" value={displayBoolean(isSpam)} />
              <StateRow
                label="Should extract"
                value={displayBoolean(jev?.shouldExtract)}
              />
              <StateRow
                label="Should handoff"
                value={displayBoolean(jev?.shouldHandoff)}
              />
              <StateRow
                label="Appointment request"
                value={displayBoolean(jev?.isAppointmentRequest)}
              />
              <StateRow
                label="Emergency"
                value={displayBoolean(isEmergency)}
              />

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Booking readiness
                </span>
                <StatusBadge value={bookingReadiness} />
              </div>
            </StateCard>

            {/* Lead */}
            <StateCard title="Lead State">
              <StateRow label="Service" value={lead?.service} />
              <StateRow label="Problem" value={lead?.problem} />
              <StateRow label="Urgency" value={lead?.urgency} />
              <StateRow label="Property type" value={lead?.propertyType} />
              <StateRow label="Address" value={lead?.address} />
              <StateRow label="City" value={lead?.city} />
              <StateRow label="State" value={lead?.state} />
              <StateRow label="ZIP code" value={lead?.zipCode} />
              <StateRow label="Preferred time" value={lead?.preferredTime} />
            </StateCard>

            {/* Appointment */}
            <StateCard title="Appointment">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Status
                </span>
                <StatusBadge value={appointmentStatus} />
              </div>

              <StateRow
                label="Appointment requested"
                value={displayBoolean(
                  state?.appointmentRequested ??
                    jev?.isAppointmentRequest,
                )}
              />

              <p className="rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                A customer asking for an appointment does not mean the
                appointment is confirmed. Check the actual appointment state
                and human approval flow.
              </p>
            </StateCard>

            {/* Tool diagnostics */}
            <StateCard title="Tool State">
              <StateRow label="Pending tool" value={state?.pendingTool} />

              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Tool result
                </p>

                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 text-[11px] leading-5 text-gray-700 dark:bg-gray-950 dark:text-gray-300">
                  {state?.toolResult === undefined ||
                  state?.toolResult === null
                    ? "No tool result"
                    : displayValue(state.toolResult)}
                </pre>
              </div>
            </StateCard>

            {/* Session */}
            <StateCard title="Test Session">
              <StateRow label="Session ID" value={sessionId} />
              <StateRow label="Messages" value={messages.length} />
            </StateCard>
          </aside>
        </div>
      </div>
    </main>
  );
}
