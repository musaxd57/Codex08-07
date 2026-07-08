import type { OperationExecutionResult, ToolExecutionResult } from "@/lib/agents/operation-executor";
import type { OperationPlan } from "@/lib/agents/operation-plan";
import type { AgentAnalysis } from "@/lib/ai/types";

export type OperatorActionSummary = {
  label: string;
  value: string | number;
  tone: "low" | "medium" | "high";
};

export type OperatorTimelineItem = {
  title: string;
  detail: string;
  status: string;
  tone: "low" | "medium" | "high";
};

export type OperatorInboundSummary = {
  headline: string;
  actions: OperatorActionSummary[];
  timeline: OperatorTimelineItem[];
  warnings: string[];
};

function toneForRisk(riskLevel: string): OperatorActionSummary["tone"] {
  if (riskLevel === "CRITICAL" || riskLevel === "HIGH") {
    return "high";
  }

  if (riskLevel === "MEDIUM") {
    return "medium";
  }

  return "low";
}

function toneForToolResult(result: ToolExecutionResult): OperatorTimelineItem["tone"] {
  if (result.status === "queued_for_human") {
    return "medium";
  }

  if (result.skipped) {
    return "high";
  }

  return "low";
}

function detailForToolResult(result: ToolExecutionResult) {
  if (result.skipReason) {
    return result.skipReason;
  }

  const createdIds = result.created ? Object.values(result.created).filter(Boolean) : [];
  if (createdIds.length > 0) {
    return `Created: ${createdIds.join(", ")}`;
  }

  return result.status === "queued_for_human"
    ? "Waiting for a human decision before guest-facing action."
    : "Internal action is ready in the execution result.";
}

export function summarizeInboundRun(input: {
  analysis: AgentAnalysis;
  plan: OperationPlan;
  execution: OperationExecutionResult;
  outbound: { status: "blocked"; reason: string };
}): OperatorInboundSummary {
  const warnings = [
    ...input.plan.blockers,
    input.outbound.reason,
    ...input.execution.results.filter((result) => result.skipped).map((result) => result.skipReason ?? result.title)
  ];

  return {
    headline:
      input.execution.queuedForHumanCount > 0
        ? "Agent prepared internal actions and queued human review."
        : "Agent prepared internal actions without guest-facing send.",
    actions: [
      { label: "Risk", value: input.analysis.riskLevel, tone: toneForRisk(input.analysis.riskLevel) },
      { label: "Mode", value: input.plan.automationMode, tone: "low" },
      { label: "Executed", value: input.execution.executedCount, tone: "low" },
      { label: "Human review", value: input.execution.queuedForHumanCount, tone: "medium" },
      { label: "Skipped", value: input.execution.skippedCount, tone: input.execution.skippedCount > 0 ? "high" : "low" }
    ],
    timeline: input.execution.results.map((result) => ({
      title: result.title,
      detail: detailForToolResult(result),
      status: result.status,
      tone: toneForToolResult(result)
    })),
    warnings: Array.from(new Set(warnings.filter(Boolean)))
  };
}
