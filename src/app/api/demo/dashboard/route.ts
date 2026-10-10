// import { NextResponse } from "next/server";
// import { eq, desc } from "drizzle-orm";

// import { db } from "@/db";

// import { leads } from "@/db/schema/lead";
// import { customers } from "@/db/schema/customer";
// import { conversations } from "@/db/schema/conversation";
// import { appointments } from "@/db/schema/appointment";

// import { getDemoSession } from "@/lib/demo-session";

// export async function GET(request: Request) {
//   try {
//     const { searchParams } =
//       new URL(request.url);

//     const sessionId =
//       searchParams.get("sessionId");

//     if (!sessionId) {
//       return NextResponse.json(
//         {
//           error: "Missing session ID",
//         },
//         {
//           status: 400,
//         }
//       );
//     }

//     const session =
//       await getDemoSession(sessionId);

//     if (!session) {
//       return NextResponse.json(
//         {
//           error:
//             "Invalid or expired demo session",
//         },
//         {
//           status: 401,
//         }
//       );
//     }

//     const recentLeads = await db
//       .select({
//         id: leads.id,

//         name: customers.name,
//         phone: customers.phone,

//         service: leads.service,
//         status: leads.status,
//         urgency: leads.urgency,

//         createdAt: leads.createdAt,

//         conversationId:
//           conversations.id,

//         conversationStatus:
//           conversations.status,

//         appointmentId:
//           appointments.id,

//         appointmentStartTime:
//           appointments.startTime,

//         appointmentEndTime:
//           appointments.endTime,

//         appointmentStatus:
//           appointments.status,
//       })
//       .from(leads)

//       .leftJoin(
//         customers,
//         eq(
//           leads.customerId,
//           customers.id
//         )
//       )

//       .leftJoin(
//         conversations,
//         eq(
//           conversations.leadId,
//           leads.id
//         )
//       )

//       .leftJoin(
//         appointments,
//         eq(
//           appointments.leadId,
//           leads.id
//         )
//       )

//       .where(
//         eq(
//           leads.demoSessionId,
//           session.id
//         )
//       )

//       .orderBy(
//         desc(leads.createdAt)
//       );

//     const totalLeads =
//       recentLeads.length;

//     const aiConversations =
//       recentLeads.filter(
//         (lead) =>
//           lead.conversationId
//       ).length;

//     const waitingForHuman =
//       recentLeads.filter(
//         (lead) =>
//           lead.status ===
//           "WAITING_FOR_HUMAN"
//       ).length;

//     return NextResponse.json({
//       stats: {
//         totalLeads,
//         aiConversations,
//         waitingForHuman,
//       },

//       leads: recentLeads,
//     });
//   } catch (error) {
//     console.error(
//       "❌ Dashboard API error:",
//       error
//     );

//     return NextResponse.json(
//       {
//         error:
//           "Failed to load dashboard",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";

import { db } from "@/db";

import { leads } from "@/db/schema/lead";
import { customers } from "@/db/schema/customer";
import { conversations } from "@/db/schema/conversation";
import { appointments } from "@/db/schema/appointment";

import { getDemoSession } from "@/lib/demo-session";

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const sessionId =
      searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        {
          error: "Missing session ID",
        },
        {
          status: 400,
        }
      );
    }

    const session =
      await getDemoSession(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired demo session",
        },
        {
          status: 401,
        }
      );
    }

    const recentLeads = await db
      .select({
        id: leads.id,

        name: customers.name,
        phone: customers.phone,

        // Lead details
        service: leads.service,
        problem: leads.problem,
        urgency: leads.urgency,
        propertyType: leads.propertyType,
        address: leads.address,
        city: leads.city,
        state: leads.state,
        zipCode: leads.zipCode,
        preferredTime: leads.preferredTime,

        status: leads.status,

        createdAt: leads.createdAt,

        // Conversation
        conversationId:
          conversations.id,

        conversationStatus:
          conversations.status,

        // Appointment
        appointmentId:
          appointments.id,

        appointmentStartTime:
          appointments.startTime,

        appointmentEndTime:
          appointments.endTime,

        appointmentStatus:
          appointments.status,
      })
      .from(leads)

      .leftJoin(
        customers,
        eq(
          leads.customerId,
          customers.id
        )
      )

      .leftJoin(
        conversations,
        eq(
          conversations.leadId,
          leads.id
        )
      )

      .leftJoin(
        appointments,
        eq(
          appointments.leadId,
          leads.id
        )
      )

      .where(
        eq(
          leads.demoSessionId,
          session.id
        )
      )

      .orderBy(
        desc(leads.createdAt)
      );

    const totalLeads =
      recentLeads.length;

    const aiConversations =
      recentLeads.filter(
        (lead) =>
          lead.conversationId
      ).length;

    const waitingForHuman =
      recentLeads.filter(
        (lead) =>
          lead.status ===
          "WAITING_FOR_HUMAN"
      ).length;

    return NextResponse.json({
      stats: {
        totalLeads,
        aiConversations,
        waitingForHuman,
      },

      leads: recentLeads,
    });
  } catch (error) {
    console.error(
      "❌ Dashboard API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load dashboard",
      },
      {
        status: 500,
      }
    );
  }
}
