import { describe, expect, it } from "vitest";
import { summarizeInboundRun } from "@/lib/integrations/operator-summary";
import type { AgentAnalysis } from "@/lib/ai/types";
import type { OperationPlan } from "@/lib/agents/operation-plan";
import type { OperationExecutionResult } from "@/lib/agents/operation-executor";

const analysis: AgentAnalysis = {
  language: "tr",
  intent: "operation_request",
  sentiment: "negative",
  riskLevel: "HIGH",
  riskReasons: ["Guest cannot enter the property."],
  taskRequired: true,
  task: {
    title: "Door code check",
    description: "Guest reports that the door code does not work.",
    category: "CHECK_IN",
    priority: "URGENT"
  },
  guestReplyDraft: "We are checking this immediately.",
  requiresHumanApproval: true,
  confidence: 0.88,
  reportTags: ["check-in"]
};

const plan: OperationPlan = {
  sourceMessageId: "message-1",
  riskLevel: "HIGH",
  automationMode: "human_only",
  summary: "Human review required.",
  blockers: ["Risk gate requires human approval."],
  steps: [],
};

const execution: OperationExecutionResult = {
  mode: "dry_run",
  automationMode: "human_only",
  executedCount: 1,
  queuedForHumanCount: 1,
  skippedCount: 1,
  results: [
    {
      tool: "create_task_suggestion",
      title: "Door code check",
      status: "executed",
      skipped: false,
      created: { taskId: "task-1" }
    },
    {
      tool: "create_approval_item",
      title: "Queue guest reply",
      status: "queued_for_human",
      skipped: false
    },
    {
      tool: "link_to_existing_issue",
      title: "Check duplicate issue",
      status: "skipped",
      skipped: true,
      skipReason: "No connector yet."
    }
  ]
};

describe("operator summary", () => {
  it("summarizes execution counts, warnings, and timeline details", () => {
    const summary = summarizeInboundRun({
      analysis,
      plan,
      execution,
      outbound: { status: "blocked", reason: "Guest-facing send is disabled." }
    });

    expect(summary.headline).toContain("queued human review");
    expect(summary.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Risk", value: "HIGH", tone: "high" }),
        expect.objectContaining({ label: "Human review", value: 1 })
      ])
    );
    expect(summary.timeline[0].detail).toBe("Created: task-1");
    expect(summary.warnings).toEqual(
      expect.arrayContaining(["Risk gate requires human approval.", "Guest-facing send is disabled.", "No connector yet."])
    );
  });
});
