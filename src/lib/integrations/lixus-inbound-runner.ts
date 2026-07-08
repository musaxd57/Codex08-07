import { z } from "zod";
import { agentOrchestrator } from "@/lib/ai/agent-orchestrator";
import { createOperationPlan, operationPlanSchema, type OperationPlan } from "@/lib/agents/operation-plan";
import { executeOperationPlan } from "@/lib/agents/operation-executor";
import {
  assertGuestSendDisabled,
  defaultLixusAgentWritePolicy,
  lixusAgentWritePolicySchema,
  lixusInboundMessageSchema,
  toGuestMessageContext
} from "@/lib/integrations/lixus-contract";
import { summarizeInboundRun } from "@/lib/integrations/operator-summary";

export const lixusInboundRunRequestSchema = z.object({
  message: lixusInboundMessageSchema,
  mode: z.enum(["dry_run", "persist"]).default("dry_run"),
  writePolicy: lixusAgentWritePolicySchema.default(defaultLixusAgentWritePolicy)
});

export type LixusInboundRunRequest = z.infer<typeof lixusInboundRunRequestSchema>;

function blockStep(step: OperationPlan["steps"][number], reason: string): OperationPlan["steps"][number] {
  return {
    ...step,
    status: "pending",
    reason: `${step.reason} Policy blocked: ${reason}`
  };
}

export function applyWritePolicyToPlan(
  plan: OperationPlan,
  policy: LixusInboundRunRequest["writePolicy"]
): OperationPlan {
  const guardedPolicy = assertGuestSendDisabled(policy);

  return operationPlanSchema.parse({
    ...plan,
    steps: plan.steps.map((step) => {
      if (step.tool === "create_task_suggestion" && !guardedPolicy.canCreateSuggestedTasks) {
        return blockStep(step, "suggested task creation is disabled.");
      }

      if (
        (step.tool === "create_approval_item" || step.tool === "draft_guest_reply") &&
        !guardedPolicy.canCreateApprovalItems
      ) {
        return blockStep(step, "approval item creation is disabled.");
      }

      if (step.tool === "add_report_signal" && !guardedPolicy.canCreateReportSignals) {
        return blockStep(step, "report signal creation is disabled.");
      }

      return step;
    })
  });
}

export async function runLixusInboundAgent(input: LixusInboundRunRequest) {
  const request = lixusInboundRunRequestSchema.parse(input);
  const writePolicy = assertGuestSendDisabled(request.writePolicy);
  const context = toGuestMessageContext(request.message);
  const { analysis, run } = await agentOrchestrator.analyzeGuestMessage(context);
  const plan = applyWritePolicyToPlan(createOperationPlan(context, analysis), writePolicy);
  const execution = await executeOperationPlan({
    tenantId: context.tenantId,
    mode: request.mode,
    plan
  });
  const outbound = {
    status: "blocked" as const,
    reason: "Guest-facing send is disabled in the Lixus integration runner."
  };

  return {
    context,
    analysis,
    plan,
    execution,
    operatorSummary: summarizeInboundRun({
      analysis,
      plan,
      execution,
      outbound
    }),
    run,
    writePolicy,
    outbound
  };
}
