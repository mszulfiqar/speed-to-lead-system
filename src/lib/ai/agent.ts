import { createAgent} from "langchain";
import { MemorySaver } from "@langchain/langgraph";

import { ChatGoogle } from "@langchain/google";

const model = new ChatGoogle({
    model: "gemini-3.6-flash",
    temperature: 0.7,
    maxRetries: 1, // Keep low so it fails quickly to fallback on rate limits
});

const checkpointer = new MemorySaver();

export const agent = createAgent({
    //   systemPrompt: "You are a helpful assistant.",
    model: model,
    checkpointer,
});