import "dotenv/config";

import { hvacGraph } from "./graph";
import { HumanMessage } from "@langchain/core/messages";

async function testGraph() {
  /*
   * Replace this with a real conversation ID
   * from your database.
   */
  const conversationId = "eb6dcc1d-1eec-48bf-a137-4c466360eb8d";

  console.log("🚀 Starting LangGraph test...");

  const result = await hvacGraph.invoke({
    conversationId,

    /*
     * These are initially empty.
     *
     * loadState will populate them from Postgres.
     */
    customerId: "",
    leadId: "",
    newMessage: "My AC is not cooling and I'm in a residential house in Dallas.",
    messages: [],
    lead: null,

    action: null,
    handoffReason: null,
    pendingTool: null,
    toolResult: null,
  });

  console.log("✅ LangGraph finished");

  console.log(
    "📋 Action:",
    result.action
  );

  console.log(
    "📋 Messages:"
  );

  for (const message of result.messages) {
    console.log(
      message.constructor.name,
      ":",
      message.content
    );
  }
}

testGraph().catch((error) => {
  console.error(
    "❌ LangGraph test failed:",
    error
  );

  process.exit(1);
});