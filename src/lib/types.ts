type MessageAI = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type ChatResponse = {
  formattedMessages: MessageAI[];
};

export type Contact = {
  id: number;
  name: string;
  phone: string;
  lastMessage: string;
  time: string;
  unread?: number;
  initials: string;
};

export type Message = {
  id: string;
  text: string;
  sender: "customer" | "ai";
  time: string;
};

