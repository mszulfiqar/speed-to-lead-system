// import { runLeadExtractor } from "../subgraphs/lead-extractor";
// import type { HVACStateType } from "../state";

// export async function leadExtractorNode(
//   state: HVACStateType
// ): Promise<Partial<HVACStateType>> {
//   const extractedLead = await runLeadExtractor(state);

//   console.log("📋 Extracted lead:", extractedLead);

//   return {
//     lead: extractedLead,
//   };
// }



import { runLeadExtractor } from "../subgraphs/lead-extractor";
import type { HVACStateType } from "../state";

export async function leadExtractorNode(
  state: HVACStateType
): Promise<Partial<HVACStateType>> {
  const extractedLead = await runLeadExtractor(state);

  console.log("📋 Extracted lead:", extractedLead);

  const currentLead = state.lead;

  const mergedLead = {
    service: extractedLead.service ?? currentLead?.service ?? null,
    problem: extractedLead.problem ?? currentLead?.problem ?? null,
    urgency: extractedLead.urgency ?? currentLead?.urgency ?? null,
    propertyType:
      extractedLead.propertyType ?? currentLead?.propertyType ?? null,
    address: extractedLead.address ?? currentLead?.address ?? null,
    city: extractedLead.city ?? currentLead?.city ?? null,
    state: extractedLead.state ?? currentLead?.state ?? null,
    zipCode: extractedLead.zipCode ?? currentLead?.zipCode ?? null,
    preferredTime:
      extractedLead.preferredTime ?? currentLead?.preferredTime ?? null,
  };

  console.log("📋 Merged lead:", mergedLead);

  return {
    lead: mergedLead,
  };
}