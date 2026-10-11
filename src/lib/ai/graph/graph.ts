
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
        return { appointmentRequested: true };
    })
    .addNode("handoff", handoffNode)
    .addNode("extract", leadExtractorNode)
    .addNode("updateLead", updateLeadNode)
    .addNode("continue", async () => {
        console.log("➡️ Continue flow");
        return {};
    })

    .addEdge(START, "loadState")
    .addEdge("loadState", "jev")

    .addConditionalEdges("jev", routeBeforeAgent, {
        emergency: "emergency",
        spam: "spam",
        aiAgent: "aiAgent",
    })

    .addConditionalEdges("aiAgent", routeAfterJev, {
        emergency: "emergency",
        spam: "spam",
        appointment: "appointment",
        handoff: "handoff",
        extract: "extract",
        continue: "continue",
    })

    .addEdge("appointment", "extract")
    .addEdge("extract", "updateLead")

    .addConditionalEdges("updateLead", routeAfterLeadUpdate, {
        handoff: "handoff",
        end: END,
    })

    .addEdge("emergency", END)
    .addEdge("spam", END)
    .addEdge("handoff", END)
    .addEdge("continue", END);


    // console.log(workflow.compile());

export const hvacGraph = workflow.compile();
