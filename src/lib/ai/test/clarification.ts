import type { AITestStateType } from "./state";

export function clarificationNode(
  state: AITestStateType
): Partial<AITestStateType> {
  const lastAiMessage = [...state.messages]
    .reverse()
    .find((message) => {
      const type = message._getType();
      return type === "ai" || type === "AIMessage";
    });

  const previousText =
    typeof lastAiMessage?.content === "string"
      ? lastAiMessage.content
      : "";

  let response =
    "Sure — could you tell me a little more about what you need help with?";

  /*
   * If the AI asked a question, stay on that topic.
   */
  if (previousText.includes("?")) {
    response =
      "No problem — could you clarify that for me?";
  }

  return {
    messages: [
      {
        role: "assistant",
        content: response,
      } as any,
    ],
    action: "CONTINUE",
  };
}