"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Message } from "@/lib/types";
import { contacts, conversations } from "@/lib/data";
// import { useRouter } from "next/router";

type ChatApiMessage = {
  id: string;
  content: string;
  senderType: "CUSTOMER" | "AI" | "HUMAN";
  createdAt: string;
};

type ChatResponse = {
  success: boolean;
  messages: ChatApiMessage[];
  aiMessage?: ChatApiMessage;
};

export default function DemoPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [selectedContactId, setSelectedContactId] =
    useState(1);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [input, setInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  const searchParams =
    useSearchParams();

  const conversationId =
    searchParams.get("conversationId");

  const sessionId =
    searchParams.get("sessionId");

  const selectedContact =
    contacts.find(
      (contact) =>
        contact.id ===
        selectedContactId
    );

  const isAIConversation =
    selectedContactId === 1;

  /*
   * ============================================================
   * FORMAT API MESSAGES
   * ============================================================
   *
   * Converts database messages into the format
   * used by the chat UI.
   *
   * It also removes duplicate message IDs.
   */
  const formatMessages = (
    apiMessages: ChatApiMessage[]
  ): Message[] => {
    const uniqueMessages =
      Array.from(
        new Map(
          apiMessages.map(
            (message) => [
              message.id,
              message,
            ]
          )
        ).values()
      );

    return uniqueMessages.map(
      (message) => ({
        id: message.id,

        text: message.content,

        sender:
          message.senderType ===
            "CUSTOMER"
            ? "customer"
            : "ai",

        time:
          new Date(
            message.createdAt
          ).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
      })
    );
  };

  /*
   * ============================================================
   * LOAD CONVERSATION
   * ============================================================
   *
   * The first AI response is processed by Inngest.
   *
   * Therefore we temporarily poll the database.
   */
  const conversationQuery =
    useQuery({
      queryKey: [
        "conversation",
        conversationId,
        sessionId,
      ],

      queryFn: async () => {
        const response =
          await fetch(
            `/api/demo/chat/${conversationId}?sessionId=${sessionId}`
          );

        /*
         * Session invalid/expired.
         */
        if (
          response.status === 401
        ) {
          window.location.href =
            "/demo/controls";

          return null;
        }

        if (!response.ok) {
          throw new Error(
            "Failed to load conversation"
          );
        }

        return response.json();
      },

      enabled: Boolean(
        conversationId &&
        sessionId
      ),

      /*
       * ========================================================
       * POLLING
       * ========================================================
       *
       * Keep checking while the AI hasn't
       * generated its first response.
       *
       * Stop polling once an AI message exists.
       */
      refetchInterval: (
        query
      ) => {
        const data =
          query.state.data;

        if (
          !data?.messages
        ) {
          return 1000;
        }

        const hasAIMessage =
          data.messages.some(
            (
              message: ChatApiMessage
            ) =>
              message.senderType ===
              "AI"
          );

        if (
          hasAIMessage
        ) {
          return false;
        }

        return 1000;
      },

      /*
       * Don't continue polling when
       * the browser tab is hidden.
       */
      refetchIntervalInBackground:
        false,
    });

  /*
   * ============================================================
   * UPDATE CHAT WHEN DATABASE CHANGES
   * ============================================================
   */
  useEffect(() => {
    if (
      !conversationQuery.data
        ?.messages
    ) {
      return;
    }

    const formattedMessages =
      formatMessages(
        conversationQuery.data
          .messages
      );

    setMessages(
      formattedMessages
    );
  }, [
    conversationQuery.data,
  ]);

  /*
   * ============================================================
   * AUTO SCROLL
   * ============================================================
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [
    messages,
    isLoading,
  ]);

  /*
   * ============================================================
   * FILTER CONTACTS
   * ============================================================
   */
  const filteredContacts =
    contacts.filter(
      (contact) => {
        const query =
          search.toLowerCase();

        return (
          contact.name
            .toLowerCase()
            .includes(query) ||

          contact.phone
            .toLowerCase()
            .includes(query) ||

          contact.lastMessage
            .toLowerCase()
            .includes(query)
        );
      }
    );

  /*
   * ============================================================
   * SELECT CONTACT
   * ============================================================
   */
  const selectContact = (
    id: number
  ) => {
    setSelectedContactId(id);

    /*
     * Live AI conversation.
     */
    if (id === 1) {
      if (
        conversationQuery.data
          ?.messages
      ) {
        const formattedMessages =
          formatMessages(
            conversationQuery.data
              .messages
          );

        setMessages(
          formattedMessages
        );
      } else {
        setMessages([]);
      }
    }

    /*
     * Static demo conversations.
     */
    else {
      setMessages(
        conversations[id] || []
      );
    }

    /*
     * Close sidebar on mobile.
     */
    if (
      window.innerWidth < 768
    ) {
      setSidebarOpen(false);
    }
  };

  /*
   * ============================================================
   * SEND MESSAGE
   * ============================================================
   */
  const sendMessage =
    async () => {
      /*
       * Only contact #1 is the real AI chat.
       */
      if (
        !isAIConversation
      ) {
        return;
      }

      /*
       * Don't send empty messages.
       */
      if (
        !input.trim()
      ) {
        return;
      }

      /*
       * Don't send another message
       * while AI is responding.
       */
      if (isLoading) {
        return;
      }

      /*
       * Make sure we have the
       * conversation/session IDs.
       */
      if (
        !conversationId ||
        !sessionId
      ) {
        console.error(
          "Missing conversationId or sessionId"
        );

        return;
      }

      const prompt =
        input.trim();

      /*
       * Clear the input immediately.
       */
      setInput("");

      /*
       * ========================================================
       * SHOW CUSTOMER MESSAGE IMMEDIATELY
       * ========================================================
       *
       * This is a normal chat message.
       *
       * The initial form message is different:
       * it comes from the database and is hidden
       * during rendering.
       */
      const customerMessage: Message =
      {
        id:
          crypto.randomUUID(),

        text: prompt,

        sender: "customer",

        time:
          new Date().toLocaleTimeString(
            [],
            {
              hour: "numeric",
              minute: "2-digit",
            }
          ),
      };

      setMessages(
        (previousMessages) => {
          /*
           * Extra protection against duplicate IDs.
           */
          const alreadyExists =
            previousMessages.some(
              (message) =>
                message.id ===
                customerMessage.id
            );

          if (
            alreadyExists
          ) {
            return previousMessages;
          }

          return [
            ...previousMessages,
            customerMessage,
          ];
        }
      );

      /*
       * Show typing indicator.
       */
      setIsLoading(true);

      try {
        const response =
          await fetch(
            `/api/demo/chat/${conversationId}`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                prompt,
                sessionId,
              }),
            }
          );

        /*
         * AI service failed.
         */
        if (
          response.status ===
          503
        ) {
          const data =
            await response.json();

          console.error(
            "AI unavailable:",
            data
          );

          return;
        }

        if (
          !response.ok
        ) {
          throw new Error(
            `Request failed: ${response.status}`
          );
        }

        const data: ChatResponse =
          await response.json();

        /*
         * ========================================================
         * ADD AI MESSAGE
         * ========================================================
         */
        if (
          data.aiMessage
        ) {
          const aiMessage: Message =
          {
            id:
              data.aiMessage.id,

            text:
              data.aiMessage
                .content,

            sender: "ai",

            time:
              new Date(
                data.aiMessage
                  .createdAt
              ).toLocaleTimeString(
                [],
                {
                  hour: "numeric",
                  minute: "2-digit",
                }
              ),
          };

          setMessages(
            (previousMessages) => {
              /*
               * IMPORTANT:
               *
               * The same AI message could already
               * have arrived through React Query
               * polling.
               *
               * Check the ID before adding it.
               */
              const alreadyExists =
                previousMessages.some(
                  (message) =>
                    message.id ===
                    aiMessage.id
                );

              if (
                alreadyExists
              ) {
                return previousMessages;
              }

              return [
                ...previousMessages,
                aiMessage,
              ];
            }
          );
        }
      } catch (error) {
        console.error(
          "Chat error:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

  /*
   * ============================================================
   * HANDLE FORM SUBMIT
   * ============================================================
   */
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    await sendMessage();
  };

  /*
   * ============================================================
   * DEDUPLICATE STATE FOR RENDERING
   * ============================================================
   *
   * This is the final safety layer.
   *
   * Even if somehow the state contains the
   * same message twice, only one copy will
   * be rendered.
   */
  const uniqueMessages =
    Array.from(
      new Map(
        messages.map(
          (message) => [
            message.id,
            message,
          ]
        )
      ).values()
    );

  /*
   * ============================================================
   * FIND INITIAL FORM MESSAGE
   * ============================================================
   *
   * The first CUSTOMER message is the message
   * that came from the lead form.
   *
   * We hide it from the UI.
   */
  const firstCustomerMessageIndex =
    uniqueMessages.findIndex(
      (message) =>
        message.sender ===
        "customer"
    );

  /*
   * ============================================================
   * CHECK AI STATE
   * ============================================================
   */
  const hasAIMessage =
    uniqueMessages.some(
      (message) =>
        message.sender ===
        "ai"
    );

  /*
   * ============================================================
   * FIRST AI TYPING INDICATOR
   * ============================================================
   *
   * After submitting the lead form:
   *
   * Form message exists
   *        ↓
   * Chat opens
   *        ↓
   * Inngest processes AI
   *        ↓
   * No AI message yet
   *        ↓
   * Show typing dots
   */
  const showInitialTyping =
    isAIConversation &&
    uniqueMessages.length >
    0 &&
    !hasAIMessage &&
    !conversationQuery.isError;

  /*
   * ============================================================
   * NORMAL AI TYPING INDICATOR
   * ============================================================
   */
  const showTyping =
    isAIConversation &&
    (isLoading ||
      showInitialTyping);

  return (
    <div className="flex h-screen bg-zinc-100">

      {/* ======================================================
          SIDEBAR
          ====================================================== */}

      {sidebarOpen && (
        <aside className="hidden w-80 shrink-0 border-r border-zinc-200 bg-white md:flex md:flex-col">

          {/* Sidebar header */}

          <div className="border-b border-zinc-200 p-4">

            <div className="flex items-center justify-between">

              <div>
                <h1 className="text-lg font-semibold text-zinc-900">
                  Conversations
                </h1>

                <p className="text-xs text-zinc-500">
                  HVAC Lead Demo
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(
                    false
                  )
                }
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
              >
                ×
              </button>

            </div>

            {/* Search */}

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search conversations..."
              className="mt-4 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />

          </div>

          {/* Contact list */}

          <div className="flex-1 overflow-y-auto">

            {filteredContacts.map(
              (contact) => (
                <button
                  type="button"
                  key={contact.id}
                  onClick={() =>
                    selectContact(
                      contact.id
                    )
                  }
                  className={`flex w-full gap-3 border-b border-zinc-100 p-4 text-left hover:bg-zinc-50 ${selectedContactId ===
                      contact.id
                      ? "bg-zinc-100"
                      : ""
                    }`}
                >

                  {/* Avatar */}

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white">
                    {contact.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  {/* Contact information */}

                  <div className="min-w-0 flex-1">

                    <div className="flex items-center justify-between">

                      <p className="truncate text-sm font-medium text-zinc-900">
                        {contact.name}
                      </p>

                      <span className="text-[10px] text-zinc-400">
                        {contact.time}
                      </span>

                    </div>

                    <p className="truncate text-xs text-zinc-500">
                      {contact.phone}
                    </p>

                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {contact.lastMessage}
                    </p>

                  </div>

                </button>
              )
            )}

          </div>

        </aside>
      )}

      {/* ======================================================
          MAIN CHAT
          ====================================================== */}

      <main className="flex min-w-0 flex-1 flex-col">

        {/* ====================================================
            HEADER
            ==================================================== */}

        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4">

          <div className="flex items-center gap-3">

            {/* Open sidebar */}

            {!sidebarOpen && (
              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(
                    true
                  )
                }
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
              >
                ☰
              </button>
            )}

            {/* Avatar */}

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white">
              {selectedContact?.name
                ?.charAt(0)
                .toUpperCase()}
            </div>

            {/* Name */}

            <div>

              <h2 className="text-sm font-semibold text-zinc-900">
                {selectedContact?.name}
              </h2>

              <p className="text-xs text-zinc-500">
                {isAIConversation
                  ? "AI Assistant"
                  : selectedContact?.phone}
              </p>

            </div>

          </div>

          {/* Live status */}

          {/* Header actions */}

          <div className="flex items-center gap-3">
            {isAIConversation && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Live
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (!sessionId) {
                  console.error("Missing session ID");
                  return;
                }

                router.push(
                  `/demo/dashboard?sessionId=${sessionId}`
                );
              }}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Open Dashboard
            </button>
          </div>

        </header>

        {/* ====================================================
            CHAT BODY
            ==================================================== */}

        <div className="flex-1 overflow-y-auto p-4">

          <div className="mx-auto flex max-w-3xl flex-col gap-3">

            {/* =================================================
                MESSAGES
                ================================================= */}

            {uniqueMessages.map(
              (
                message,
                index
              ) => {

                /*
                 * =================================================
                 * HIDE INITIAL FORM MESSAGE
                 * =================================================
                 *
                 * The first customer message came from
                 * the lead form.
                 *
                 * We DON'T delete it from the database.
                 *
                 * We simply don't render it.
                 */
                const isInitialFormMessage =
                  message.sender ===
                  "customer" &&
                  index ===
                  firstCustomerMessageIndex;

                if (
                  isInitialFormMessage
                ) {
                  return null;
                }

                return (
                  <div
                    key={
                      message.id
                    }
                    className={`flex ${message.sender ===
                        "customer"
                        ? "justify-end"
                        : "justify-start"
                      }`}
                  >

                    <div
                      className={`
                        max-w-[80%]
                        rounded-2xl
                        px-4
                        py-2.5
                        text-sm

                        ${message.sender ===
                          "customer"
                          ? "rounded-br-md bg-zinc-900 text-white"
                          : "rounded-bl-md bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
                        }
                      `}
                    >

                      <p className="whitespace-pre-wrap">
                        {
                          message.text
                        }
                      </p>

                      <p className="mt-1 text-[10px] text-zinc-400">
                        {
                          message.time
                        }
                      </p>

                    </div>

                  </div>
                );
              }
            )}

            {/* =================================================
                TYPING INDICATOR
                ================================================= */}

            {showTyping && (
              <div className="flex justify-start">

                <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200">

                  <div className="flex items-center gap-1">

                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />

                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />

                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />

                  </div>

                </div>

              </div>
            )}

            <div ref={messagesEndRef} />

          </div>

        </div>

        {/* ====================================================
            INPUT
            ==================================================== */}

        <div className="border-t border-zinc-200 bg-white p-4">

          <form
            onSubmit={
              handleSubmit
            }
            className="mx-auto flex max-w-3xl gap-2"
          >

            <input
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              disabled={
                !isAIConversation ||
                isLoading
              }
              placeholder={
                isAIConversation
                  ? "Type a message..."
                  : "This is a demo conversation"
              }
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={
                !isAIConversation ||
                isLoading ||
                !input.trim()
              }
              className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>

          </form>

          <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-zinc-400">
            AI responses are simulated
            for this demo.
          </p>

        </div>

      </main>

    </div>
  );
}
