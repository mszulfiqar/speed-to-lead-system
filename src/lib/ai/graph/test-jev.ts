import "dotenv/config";

import { runJev } from "./jev";

async function main() {
  console.log("🧠 Testing Jev...");

  const result = await runJev({
    latestMessage:
      "My AC stopped cooling yesterday. It's running but only blowing warm air. Can someone come tomorrow afternoon?",

    lead: {
      service: "AC Repair",
      problem: "AC is not cooling",
      urgency: null,
      propertyType: "RESIDENTIAL",
      address: null,
      city: null,
      state: null,
      zipCode: null,
      preferredTime: null,
    },

    conversation: [
      "Customer: My AC is running but not cooling.",
      "AI: When did the problem start?",
      "Customer: Yesterday. It's blowing warm air.",
    ],
  });

  console.log("✅ Jev result:");
  console.dir(result, { depth: null });
}

main().catch((error) => {
  console.error("❌ Jev test failed:");
  console.error(error);
  process.exit(1);
});
