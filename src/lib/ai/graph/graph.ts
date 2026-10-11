import {
    END,
    START,
    StateGraph,
} from "@langchain/langgraph";

import { HVACState } from "./state";

import { aiAgent } from "./nodes/ai-agent";
import { jevNode } from "./nodes/jev";
import { leadExtractorNode } from "./nodes/lead-extractor";
import { updateLeadNode } from "./nodes/update-lead";
import { loadState } from "./nodes/load-state";

import {
    routeBeforeAgent,
    routeAfterJev,
    routeAfterLeadUpdate,
} from "./routes";

import { handoffNode } from "./nodes/handoff";

const workflow = new StateGraph(HVACState)

    // -------------------------
    // Nodes
    // -------------------------

    .addNode("loadState", loadState)

    .addNode("jev", jevNode)

    .addNode("aiAgent", aiAgent)

    .addNode("emergency", async () => {
        console.log("🚨 Emergency flow");
        return {};
    })

    .addNode("spam", async () => {
        console.log("🚫 Spam detected; stopping AI workflow");
        return {};
    })

    .addNode("appointment", async () => {
        console.log("📅 Appointment request detected");

        return {
            appointmentRequested: true,
        };
    })

    .addNode("handoff", handoffNode)

    .addNode("extract", leadExtractorNode)

    .addNode("updateLead", updateLeadNode)

    .addNode("continue", async () => {
        console.log("➡️ Continue flow");
        return {};
    })

    // -------------------------
    // Main flow
    // -------------------------

    .addEdge(START, "loadState")
    .addEdge("loadState", "jev")

    // -------------------------
    // First routing:
    // Jev classifies before AI generation
    // -------------------------

    .addConditionalEdges(
        "jev",
        routeBeforeAgent,
        {
            emergency: "emergency",
            spam: "spam",
            aiAgent: "aiAgent",
        }
    )

    // -------------------------
    // Second routing:
    // Preserve existing normal-message behavior
    // -------------------------

    .addConditionalEdges(
        "aiAgent",
        routeAfterJev,
        {
            emergency: "emergency",
            spam: "spam",
            appointment: "appointment",
            handoff: "handoff",
            extract: "extract",
            continue: "continue",
        }
    )

    // -------------------------
    // Appointment
    // -------------------------

    .addEdge("appointment", "extract")

    // -------------------------
    // Lead extraction
    // -------------------------

    .addEdge("extract", "updateLead")

    // -------------------------
    // After lead update
    // -------------------------

    .addConditionalEdges(
        "updateLead",
        routeAfterLeadUpdate,
        {
            handoff: "handoff",
            end: END,
        }
    )

    // -------------------------
    // Terminal flows
    // -------------------------

    .addEdge("emergency", END)

    .addEdge("spam", END)

    .addEdge("handoff", END)

    .addEdge("continue", END);

export const hvacGraph = workflow.compile();
