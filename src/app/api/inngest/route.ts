// src/app/api/inngest/route.ts
import { inngest } from "@/lib/inngest/client";
import { processConversationJob } from "@/lib/inngest/functions/process-conversation";
import { serve } from "inngest/next";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processConversationJob
  ],
});