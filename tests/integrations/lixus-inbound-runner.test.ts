import { describe, expect, it } from "vitest";
import { applyWritePolicyToPlan, runLixusInboundAgent } from "@/lib/integrations/lixus-inbound-runner";
import type { OperationPlan } from "@/lib/agents/operation-plan";

const samplePlan: OperationPlan = {
  sourceMessageId: "message-1",
  riskLevel: "HIGH",
  automationMode: "human_only",
  summary: "High-risk message.",
  blockers: ["Human approval required."],
  steps: [
    {
      tool: "create_task_suggestion",
      title: "Door code check",
      reason: "Guest cannot enter.",
      status: "safe_to_automate",
      payload: {}
    },
    {
      tool: "create_approval_item",
      title: "Queue reply",
      reason: "Guest-facing reply needs review.",
      status: "requires_human",
      payload: {}
    },
    {
      tool: "add_report_signal",
      title: "Track issue",
      reason: "Report check-in issue.",
      status: "safe_to_automate",
      payload: {}
    }
  ]
};

describe("lixus inbound runner", () => {
  it("applies write policy by blocking disabled persistent actions", () => {
    const guarded = applyWritePolicyToPlan(samplePlan, {
      canCreateSuggestedTasks: false,
      canCreateApprovalItems: false,
      canCreateReportSignals: true,
      canSendGuestMessages: false
    });

    expect(guarded.steps[0]).toMatchObject({ tool: "create_task_suggestion", status: "pending" });
    expect(guarded.steps[1]).toMatchObject({ tool: "create_approval_item", status: "pending" });
    expect(guarded.steps[2]).toMatchObject({ tool: "add_report_signal", status: "safe_to_automate" });
  });

  it("runs the full inbound flow in dry-run mode with outbound send blocked", async () => {
    const result = await runLixusInboundAgent({
      mode: "dry_run",
      message: {
        tenantId: "tenant-1",
        messageId: "message-1",
        conversationId: "conversation-1",
        body: "Kapı şifresi çalışmıyor, dışarıda kaldık.",
        channel: "AIRBNB",
        property: { id: "property-1", name: "Galata Loft" },
        reservation: { id: "reservation-1", status: "confirmed" },
        recentMessages: []
      },
      writePolicy: {
        canCreateSuggestedTasks: true,
        canCreateApprovalItems: true,
        canCreateReportSignals: true,
        canSendGuestMessages: false
      }
    });

    expect(result.context.sourceMessageId).toBe("message-1");
    expect(result.plan.steps.length).toBeGreaterThan(0);
    expect(result.execution.mode).toBe("dry_run");
    expect(result.outbound.status).toBe("blocked");
  });
});
