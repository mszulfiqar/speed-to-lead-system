
import { inngest } from "../client";
import { processConversation } from "@/lib/ai/process-conversation";

export const processConversationJob = inngest.createFunction(
    {
        id: "process-demo-conversation",
        retries: 3,
        triggers: {
            event: "demo/conversation.created",
        },
    },
    async ({ event }) => {
        const { conversationId, newMessage } = event.data;

        console.log(
            "🚀 Inngest processing conversation:",
            conversationId
        );

        const aiMessage = await processConversation(
            conversationId,
            newMessage
        );

        console.log(
            "✅ Inngest finished conversation:",
            conversationId
        );

        // Spam or human-waiting conversations may intentionally
        // return null because no AI response was saved.
        if (!aiMessage) {
            return {
                success: true,
                conversationId,
                skipped: true,
                messageId: null,
            };
        }

        return {
            success: true,
            conversationId,
            skipped: false,
            messageId: aiMessage.id,
        };
    }
);
