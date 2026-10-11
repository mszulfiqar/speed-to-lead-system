
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

 const [currentLead] = await db
  .select()
  .from(leads)
  .where(eq(leads.id, state.leadId))
  .limit(1);

  if (!currentLead) {
    console.log("⚠️ Lead not found:", state.leadId);
    return {};
  }

  const lead = state.lead;

  await db
    .update(leads)
    .set({
      service: lead.service ?? currentLead.service,
      problem: lead.problem ?? currentLead.problem,
      urgency: lead.urgency ?? currentLead.urgency,
      propertyType: lead.propertyType ?? currentLead.propertyType,
      address: lead.address ?? currentLead.address,
      city: lead.city ?? currentLead.city,
      state: lead.state ?? currentLead.state,
      zipCode: lead.zipCode ?? currentLead.zipCode,
      preferredTime: lead.preferredTime ?? currentLead.preferredTime,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, state.leadId));

  console.log("💾 Lead updated:", state.leadId);
  console.log("📋 Persisted lead fields:", {
    service: lead.service ?? currentLead.service,
    problem: lead.problem ?? currentLead.problem,
    address: lead.address ?? currentLead.address,
    preferredTime: lead.preferredTime ?? currentLead.preferredTime,
  });

  return {};
}
