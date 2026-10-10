import { eq, asc } from "drizzle-orm";

import { db } from "@/db";

import { conversations } from "@/db/schema/conversation";
import { customers } from "@/db/schema/customer";
import { leads } from "@/db/schema/lead";
import { messages as dbMessages } from "@/db/schema/message";

import {
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";

import type { HVACStateType } from "../state";

export async function loadState(
  state: HVACStateType
): Promise<Partial<HVACStateType>> {
  const { conversationId, newMessage } = state;

  // --------------------------------------------------
  // 1. Load conversation
  // --------------------------------------------------

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      eq(
        conversations.id,
        conversationId
      )
    )
    .limit(1);

  if (!conversation) {
    throw new Error(
      "Conversation not found"
    );
  }

  // --------------------------------------------------
  // 2. Load customer
  // --------------------------------------------------

  const [customer] = await db
    .select()
    .from(customers)
    .where(
      eq(
        customers.id,
        conversation.customerId
      )
    )
    .limit(1);

  if (!customer) {
    throw new Error(
      "Customer not found"
    );
  }

  // --------------------------------------------------
  // 3. Load lead
  // --------------------------------------------------

  const [lead] = await db
    .select()
    .from(leads)
    .where(
      eq(
        leads.id,
        conversation.leadId
      )
    )
    .limit(1);

  if (!lead) {
    throw new Error(
      "Lead not found"
    );
  }

  // --------------------------------------------------
  // 4. Load existing conversation history
  // --------------------------------------------------

  const conversationMessages =
    await db
      .select()
      .from(dbMessages)
      .where(
        eq(
          dbMessages.conversationId,
          conversationId
        )
      )
      .orderBy(
        asc(dbMessages.createdAt)
      );

  // --------------------------------------------------
  // 5. Convert DB messages to LangChain messages
  // --------------------------------------------------

  const graphMessages =
    conversationMessages.map(
      (message) => {
        if (
          message.senderType ===
          "CUSTOMER"
        ) {
          return new HumanMessage({
            content:
              message.content,
          });
        }

        if (
          message.senderType === "AI"
        ) {
          return new AIMessage({
            content:
              message.content,
          });
        }

        return new HumanMessage({
          content:
            message.content,
        });
      }
    );

  // --------------------------------------------------
  // 6. Add the NEW customer message
  //
  // This guarantees that the message sent to
  // the AI is a user/customer turn.
  // --------------------------------------------------

//   graphMessages.push(
//     new HumanMessage({
//       content: newMessage,
//     })
//   );

  // --------------------------------------------------
  // 7. Return graph state
  // --------------------------------------------------
  const lastMessage = graphMessages.at(-1);

  const lastMessageIsSameCustomerMessage =
    lastMessage?._getType() === "human" &&
    String(lastMessage.content) === newMessage;

  if (!lastMessageIsSameCustomerMessage) {
    graphMessages.push(
      new HumanMessage({
        content: newMessage,
      })
    );
  }

  return {
    customerId: customer.id,
    leadId: lead.id,

    messages: graphMessages,

    lead: {
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
    },
  };
}
