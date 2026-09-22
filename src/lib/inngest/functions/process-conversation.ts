import { inngest } from "../client";
import { processConversation } from "@/lib/ai/process-conversation";

export const processConversationJob = inngest.createFunction(
    { id: "process-demo-conversation", retries: 3, triggers:{event:"demo/conversation.created"} },
    async ({ event}) => {
        const { conversationId } = event.data;

        console.log("🚀 Inngest processing conversation:", conversationId);

        const aiMessage = await processConversation(conversationId);

        console.log("✅ Inngest finished conversation:", conversationId);

        return {
            success: true,
            conversationId,
            messageId: aiMessage.id,
        };
    }
)