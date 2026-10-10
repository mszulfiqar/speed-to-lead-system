import { eq } from "drizzle-orm";

import { db } from "@/db";
import { leads } from "@/db/schema/lead";

import type { HVACStateType } from "../state";

export async function updateLeadNode(
  state: HVACStateType
): Promise<Partial<HVACStateType>> {
  if (!state.leadId || !state.lead) {
    console.log("⚠️ No lead available to update");
    return {};
  }

  await db
    .update(leads)
    .set({
      service: state.lead.service,
      problem: state.lead.problem,
      urgency: state.lead.urgency,
      propertyType: state.lead.propertyType,
      address: state.lead.address,
      city: state.lead.city,
      state: state.lead.state,
      zipCode: state.lead.zipCode,
      preferredTime: state.lead.preferredTime,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, state.leadId));

  console.log("💾 Lead updated:", state.leadId);

  return {};
}