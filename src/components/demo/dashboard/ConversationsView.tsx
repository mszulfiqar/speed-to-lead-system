"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bot,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  MessageSquare,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Conversation = {
  id: string;
  leadId: string;

  customerName: string | null;
  phone: string | null;

  service: string | null;
  problem: string | null;
  urgency: string | null;

  propertyType: string | null;

  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;

  preferredTime: string | null;

  leadStatus: string;
  conversationStatus: string;

  appointmentId: string | null;

  appointmentStartTime: string | null;

  appointmentEndTime: string | null;

  appointmentStatus:
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED"
    | "COMPLETED"
    | "NO_SHOW"
    | null;
};

type Message = {
  id: string;
  senderType: string;
  content: string;
  createdAt: string;
};

type Props = {
  sessionId: string;
  conversationId: string | null;
};

/*
 * Fetch conversations
 */
async function fetchConversations(
  sessionId: string
): Promise<Conversation[]> {
  const response = await fetch(
    `/api/demo/dashboard?sessionId=${sessionId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to load conversations"
    );
  }

  return data.leads
    .filter(
      (lead: {
        conversationId: string | null;
      }) => Boolean(lead.conversationId)
    )
    .map(
      (lead: {
        id: string;
        conversationId: string;

        name: string | null;
        phone: string | null;

        service: string | null;
        problem: string | null;
        urgency: string | null;

        propertyType: string | null;

        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;

        preferredTime: string | null;

        status: string;

        conversationStatus:
          | string
          | null;

        appointmentId:
          | string
          | null;

        appointmentStartTime:
          | string
          | null;

        appointmentEndTime:
          | string
          | null;

        appointmentStatus:
          | Conversation["appointmentStatus"];
      }) => ({
        id: lead.conversationId,

        leadId: lead.id,

        customerName: lead.name,

        phone: lead.phone,

        service: lead.service,

        problem: lead.problem,

        urgency: lead.urgency,

        propertyType:
          lead.propertyType,

        address: lead.address,

        city: lead.city,

        state: lead.state,

        zipCode: lead.zipCode,

        preferredTime:
          lead.preferredTime,

        leadStatus: lead.status,

        conversationStatus:
          lead.conversationStatus ||
          "AI_ACTIVE",

        appointmentId:
          lead.appointmentId,

        appointmentStartTime:
          lead.appointmentStartTime,

        appointmentEndTime:
          lead.appointmentEndTime,

        appointmentStatus:
          lead.appointmentStatus,
      })
    );
}

/*
 * Fetch messages
 */
async function fetchMessages(
  conversationId: string,
  sessionId: string
): Promise<Message[]> {
  const response = await fetch(
    `/api/demo/chat/${conversationId}?sessionId=${sessionId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Failed to load messages"
    );
  }

  return data.messages || [];
}

export default function ConversationsView({
  sessionId,
  conversationId,
}: Props) {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const [selectedId, setSelectedId] =
    useState<string | null>(
      conversationId
    );

  /*
   * Keep selected conversation
   * synchronized with the URL.
   */
  useEffect(() => {
    setSelectedId(conversationId);
  }, [conversationId]);

  /*
   * Conversations query
   */
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    isError: conversationsError,
  } = useQuery({
    queryKey: [
      "demo-conversations",
      sessionId,
    ],

    queryFn: () =>
      fetchConversations(
        sessionId
      ),

    enabled: Boolean(sessionId),

    refetchInterval: 3000,
  });

  /*
   * Automatically select first conversation
   * only when there is no conversationId
   * in the URL.
   */
  useEffect(() => {
    if (
      !conversationId &&
      !selectedId &&
      conversations.length > 0
    ) {
      const firstId =
        conversations[0].id;

      setSelectedId(firstId);

      const params =
        new URLSearchParams(
          searchParams.toString()
        );

      params.set(
        "conversationId",
        firstId
      );

      router.replace(
        `/demo/dashboard/conversations?${params.toString()}`
      );
    }
  }, [
    conversationId,
    selectedId,
    conversations,
    router,
    searchParams,
  ]);

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation.id ===
        selectedId
    ) || null;

  /*
   * Select conversation and update URL.
   */
  function selectConversation(
    id: string
  ) {
    setSelectedId(id);

    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    params.set(
      "conversationId",
      id
    );

    router.push(
      `/demo/dashboard/conversations?${params.toString()}`
    );
  }

  if (conversationsLoading) {
    return (
      <div className="mx-auto flex min-h-[600px] w-full max-w-7xl items-center justify-center">
        <Card className="w-full">
          <CardContent className="flex min-h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Loading conversations...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (conversationsError) {
    return (
      <div className="mx-auto flex min-h-[600px] w-full max-w-7xl items-center justify-center">
        <Card className="w-full border-red-200">
          <CardContent className="flex min-h-[300px] items-center justify-center">
            <p className="text-sm text-red-600">
              Failed to load conversations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Page heading */}
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium text-emerald-600">
          Inbox
        </p>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Conversations
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Manage customer conversations and
          human handoffs.
        </p>
      </div>

      {/* Main inbox */}
      <Card className="h-[650px] overflow-hidden">
        <div className="grid h-full min-h-0 lg:grid-cols-[320px_1fr]">
          {/* Conversation list */}
          <div className="min-h-0 overflow-y-auto border-b lg:border-b-0 lg:border-r">
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    All conversations
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {conversations.length}{" "}
                    {conversations.length === 1
                      ? "conversation"
                      : "conversations"}
                  </p>
                </div>

                <Badge
                  variant="secondary"
                  className="font-normal"
                >
                  Live
                </Badge>
              </div>
            </div>

            <Separator />

            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-slate-100">
                  <MessageSquare className="size-4 text-slate-500" />
                </div>

                <p className="text-sm font-medium text-slate-700">
                  No conversations yet.
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  New conversations will appear here.
                </p>
              </div>
            ) : (
              <div>
                {conversations.map(
                  (conversation) => {
                    const active =
                      conversation.id ===
                      selectedId;

                    const waitingForHuman =
                      conversation.conversationStatus ===
                      "WAITING_FOR_HUMAN";

                    const humanActive =
                      conversation.conversationStatus ===
                      "HUMAN_ACTIVE";

                    const pendingBooking =
                      conversation.appointmentStatus ===
                      "PENDING";

                    return (
                      <button
                        key={
                          conversation.id
                        }
                        type="button"
                        onClick={() =>
                          selectConversation(
                            conversation.id
                          )
                        }
                        className={`flex w-full gap-3 border-b px-4 py-4 text-left transition ${
                          active
                            ? "bg-slate-100"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            active
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {(
                            conversation.customerName ||
                            "?"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium text-slate-950">
                              {conversation.customerName ||
                                "Unknown Customer"}
                            </p>

                            <div className="flex shrink-0 items-center gap-1.5">
                              {pendingBooking && (
                                <span className="size-2 rounded-full bg-amber-500" />
                              )}

                              {waitingForHuman && (
                                <span className="size-2 rounded-full bg-yellow-500" />
                              )}

                              {humanActive && (
                                <span className="size-2 rounded-full bg-emerald-500" />
                              )}
                            </div>
                          </div>

                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {conversation.service ||
                              "Service not specified"}
                          </p>

                          <div className="mt-2 flex items-center gap-2">
                            <StatusBadge
                              status={
                                conversation.conversationStatus
                              }
                            />

                            {pendingBooking && (
                              <Badge
                                variant="outline"
                                className="border-amber-200 bg-amber-50 text-[10px] font-medium uppercase tracking-wider text-amber-700"
                              >
                                Booking
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* Conversation panel */}
          <div className="min-h-0 min-w-0">
            {selectedConversation ? (
              <ConversationPanel
                conversation={
                  selectedConversation
                }
                sessionId={sessionId}
              />
            ) : (
              <div className="flex h-full min-h-[650px] items-center justify-center p-8">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100">
                    <MessageSquare className="size-5 text-slate-500" />
                  </div>

                  <p className="text-sm font-medium text-slate-700">
                    Select a conversation
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose a conversation from the inbox.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ConversationPanel({
  conversation,
  sessionId,
}: {
  conversation: Conversation;
  sessionId: string;
}) {
  const queryClient =
    useQueryClient();

  const [message, setMessage] =
    useState("");

  /*
   * Reference to the messages scroll container.
   */
  const messagesContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /*
   * Messages query
   */
  const {
    data: messages = [],
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: [
      "demo-messages",
      conversation.id,
      sessionId,
    ],

    queryFn: () =>
      fetchMessages(
        conversation.id,
        sessionId
      ),

    enabled: Boolean(
      conversation.id &&
        sessionId
    ),

    refetchInterval: 3000,
  });

  /*
   * Automatically scroll to the latest
   * message whenever messages change
   * or the conversation changes.
   */
  useEffect(() => {
    const container =
      messagesContainerRef.current;

    if (
      !container ||
      messages.length === 0
    ) {
      return;
    }

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [
    messages,
    conversation.id,
  ]);

  /*
   * TAKEOVER MUTATION
   */
  const takeoverMutation =
    useMutation({
      mutationFn: async () => {
        const response =
          await fetch(
            `/api/demo/conversation/${conversation.id}/takeover`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                sessionId,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to take over conversation"
          );
        }

        return data;
      },

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "demo-conversations",
            sessionId,
          ],
        });
      },
    });

  /*
   * APPROVE BOOKING MUTATION
   */
  const approveBookingMutation =
    useMutation({
      mutationFn: async () => {
        if (
          !conversation.appointmentStartTime ||
          !conversation.appointmentEndTime
        ) {
          throw new Error(
            "Appointment time is missing"
          );
        }

        const response =
          await fetch(
            "/api/demo/calendar/approve",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                sessionId,

                leadId:
                  conversation.leadId,

                startTime:
                  conversation.appointmentStartTime,

                endTime:
                  conversation.appointmentEndTime,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to approve booking"
          );
        }

        return data;
      },

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "demo-conversations",
            sessionId,
          ],
        });

        queryClient.invalidateQueries({
          queryKey: [
            "demo-calendar",
            sessionId,
          ],
        });

        queryClient.invalidateQueries({
          queryKey: [
            "demo-dashboard",
            sessionId,
          ],
        });
      },
    });

  /*
   * HUMAN MESSAGE MUTATION
   */
  const sendMessageMutation =
    useMutation({
      mutationFn: async (
        content: string
      ) => {
        const response =
          await fetch(
            `/api/demo/conversation/${conversation.id}/message`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                sessionId,
                content,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to send message"
          );
        }

        return data;
      },

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "demo-messages",
            conversation.id,
            sessionId,
          ],
        });

        setMessage("");
      },
    });

  const status =
    conversation.conversationStatus;

  const waitingForHuman =
    status ===
    "WAITING_FOR_HUMAN";

  const humanActive =
    status === "HUMAN_ACTIVE";

  const aiActive =
    status === "AI_ACTIVE";

  const pendingBooking =
    conversation.appointmentStatus ===
    "PENDING";

  const confirmedBooking =
    conversation.appointmentStatus ===
    "CONFIRMED";

  function handleTakeover() {
    if (
      takeoverMutation.isPending
    ) {
      return;
    }

    takeoverMutation.mutate();
  }

  function handleApproveBooking() {
    if (
      approveBookingMutation.isPending
    ) {
      return;
    }

    approveBookingMutation.mutate();
  }

  function handleSend() {
    const trimmed =
      message.trim();

    if (
      !trimmed ||
      sendMessageMutation.isPending
    ) {
      return;
    }

    if (!humanActive) {
      return;
    }

    sendMessageMutation.mutate(
      trimmed
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      {/* Conversation header */}
      <div className="shrink-0 flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
            {(
              conversation.customerName ||
              "?"
            )
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-950">
              {conversation.customerName ||
                "Unknown Customer"}
            </h2>

            <p className="mt-1 truncate text-xs text-muted-foreground">
              {conversation.service ||
                "Service not specified"}

              {conversation.phone
                ? ` · ${conversation.phone}`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* TAKEOVER */}
          {(aiActive ||
            waitingForHuman) && (
            <Button
              type="button"
              size="sm"
              onClick={
                handleTakeover
              }
              disabled={
                takeoverMutation.isPending
              }
              className="gap-2"
            >
              <UserRound className="size-4" />

              {takeoverMutation.isPending
                ? "Taking over..."
                : "Take over"}
            </Button>
          )}

          {/* HUMAN ACTIVE */}
          {humanActive && (
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-700"
            >
              <CheckCircle2 className="size-3" />
              Human active
            </Badge>
          )}

          {/* AI ACTIVE FALLBACK */}
          {!aiActive &&
            !waitingForHuman &&
            !humanActive && (
              <Badge
                variant="secondary"
                className="gap-1.5 px-3 py-1 text-[10px] font-medium uppercase tracking-wider"
              >
                <Bot className="size-3" />
                AI active
              </Badge>
            )}
        </div>
      </div>

      {/* Booking request */}
      {pendingBooking && (
        <div className="shrink-0 border-b bg-amber-50/70 px-5 py-4">
          <div className="flex flex-col gap-4">
            {/* Booking header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                  <CalendarCheck className="size-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                    Booking request
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    Verify customer details before booking
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={
                  handleApproveBooking
                }
                disabled={
                  approveBookingMutation.isPending
                }
                className="shrink-0 gap-2"
              >
                <CalendarCheck className="size-4" />

                {approveBookingMutation.isPending
                  ? "Approving..."
                  : "Approve & Book"}
              </Button>
            </div>

            {/* Verification details */}
            <div className="rounded-lg border border-amber-200 bg-white">
              <div className="grid gap-x-6 gap-y-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <VerificationField
                  label="Customer"
                  value={
                    conversation.customerName
                  }
                />

                <VerificationField
                  label="Phone"
                  value={
                    conversation.phone
                  }
                />

                <VerificationField
                  label="Service"
                  value={
                    conversation.service
                  }
                />

                <VerificationField
                  label="Problem"
                  value={
                    conversation.problem
                  }
                  wide
                />

                <VerificationField
                  label="Urgency"
                  value={
                    formatVerificationValue(
                      conversation.urgency
                    )
                  }
                />

                <VerificationField
                  label="Property"
                  value={
                    formatVerificationValue(
                      conversation.propertyType
                    )
                  }
                />

                <VerificationField
                  label="Address"
                  value={
                    conversation.address
                  }
                  wide
                />

                <VerificationField
                  label="City"
                  value={
                    conversation.city
                  }
                />

                <VerificationField
                  label="State"
                  value={
                    conversation.state
                  }
                />

                <VerificationField
                  label="ZIP"
                  value={
                    conversation.zipCode
                  }
                />

                <VerificationField
                  label="Customer requested"
                  value={
                    conversation.preferredTime
                  }
                  wide
                />
              </div>

              <Separator />

              {/* Appointment slot */}
              <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Appointment slot
                  </p>

                  {conversation.appointmentStartTime ? (
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-900">
                      <Clock3 className="size-3.5 text-slate-500" />

                      {new Date(
                        conversation.appointmentStartTime
                      ).toLocaleString(
                        "en-US",
                        {
                          weekday:
                            "short",
                          month:
                            "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute:
                            "2-digit",
                        }
                      )}

                      {conversation.appointmentEndTime &&
                        ` – ${new Date(
                          conversation.appointmentEndTime
                        ).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "numeric",
                            minute:
                              "2-digit",
                          }
                        )}`}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">
                      Appointment time not set
                    </p>
                  )}
                </div>

                <Badge
                  variant="outline"
                  className="w-fit border-amber-200 bg-amber-50 text-[10px] font-medium uppercase tracking-wider text-amber-700"
                >
                  Pending approval
                </Badge>
              </div>
            </div>
          </div>

          {approveBookingMutation.isError && (
            <p className="mt-3 text-xs text-red-600">
              {approveBookingMutation.error instanceof
              Error
                ? approveBookingMutation.error.message
                : "Failed to approve booking."}
            </p>
          )}
        </div>
      )}

      {/* Confirmed booking */}
      {confirmedBooking && (
        <div className="shrink-0 border-b bg-emerald-50/70 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-4" />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                Appointment confirmed
              </p>

              {conversation.appointmentStartTime && (
                <p className="mt-1 text-sm text-emerald-800">
                  {new Date(
                    conversation.appointmentStartTime
                  ).toLocaleString(
                    "en-US",
                    {
                      weekday:
                        "short",
                      month:
                        "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    }
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-5"
      >
        {messagesLoading ? (
          <div className="flex h-full min-h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Loading messages...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full min-h-40 items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-2 size-5 text-slate-400" />

              <p className="text-sm text-muted-foreground">
                No messages yet.
              </p>
            </div>
          </div>
        ) : (
          messages.map((item) => {
            const customer =
              item.senderType ===
              "CUSTOMER";

            return (
              <div
                key={item.id}
                className={`flex ${
                  customer
                    ? "justify-start"
                    : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-3 text-sm shadow-sm ${
                    customer
                      ? "border bg-white text-slate-800"
                      : "bg-slate-900 text-white"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    {customer ? (
                      <UserRound className="size-3 opacity-50" />
                    ) : (
                      <Bot className="size-3 opacity-50" />
                    )}

                    <p className="text-[10px] font-medium uppercase tracking-wider opacity-50">
                      {item.senderType}
                    </p>
                  </div>

                  <p className="whitespace-pre-wrap leading-relaxed">
                    {item.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t bg-white p-4">
        {waitingForHuman && (
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <UserRound className="size-3.5" />

            <span>
              Take over the conversation to
              reply as a human.
            </span>
          </div>
        )}

        {humanActive && (
          <div className="mb-3 flex items-center gap-2 text-xs text-emerald-600">
            <CheckCircle2 className="size-3.5" />

            <span>
              You are now controlling this
              conversation.
            </span>
          </div>
        )}

        {aiActive && (
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Bot className="size-3.5" />

            <span>
              AI is currently handling this
              conversation.
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(event) =>
              setMessage(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();

                handleSend();
              }
            }}
            disabled={
              !humanActive ||
              sendMessageMutation.isPending
            }
            placeholder={
              humanActive
                ? "Type a message..."
                : "Take over to reply"
            }
            className="h-10"
          />

          <Button
            type="button"
            onClick={handleSend}
            disabled={
              !humanActive ||
              sendMessageMutation.isPending ||
              !message.trim()
            }
          >
            {sendMessageMutation.isPending
              ? "..."
              : "Send"}
          </Button>
        </div>

        {/* Mutation errors */}
        {takeoverMutation.isError && (
          <p className="mt-2 text-xs text-red-500">
            {takeoverMutation.error
              .message}
          </p>
        )}

        {sendMessageMutation.isError && (
          <p className="mt-2 text-xs text-red-500">
            {sendMessageMutation.error
              .message}
          </p>
        )}
      </div>
    </div>
  );
}

/*
 * Verification field
 */
function VerificationField({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string | null;
  wide?: boolean;
}) {
  return (
    <div
      className={
        wide
          ? "sm:col-span-2 lg:col-span-2"
          : ""
      }
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-900">
        {value || "Not provided"}
      </p>
    </div>
  );
}

/*
 * Format enum values for display.
 */
function formatVerificationValue(
  value: string | null
) {
  if (!value) {
    return null;
  }

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toUpperCase();

  if (normalized === "HUMAN_ACTIVE") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-[10px] font-medium uppercase tracking-wider text-emerald-700"
      >
        Human active
      </Badge>
    );
  }

  if (
    normalized ===
    "WAITING_FOR_HUMAN"
  ) {
    return (
      <Badge
        variant="outline"
        className="border-yellow-200 bg-yellow-50 text-[10px] font-medium uppercase tracking-wider text-yellow-700"
      >
        Needs reply
      </Badge>
    );
  }

  if (normalized === "AI_ACTIVE") {
    return (
      <Badge
        variant="outline"
        className="border-sky-200 bg-sky-50 text-[10px] font-medium uppercase tracking-wider text-sky-700"
      >
        AI active
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="text-[10px] font-medium uppercase tracking-wider"
    >
      {normalized.replaceAll(
        "_",
        " "
      )}
    </Badge>
  );
}
