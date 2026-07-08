import { defaultLixusAgentWritePolicy, type LixusAgentWritePolicy } from "@/lib/integrations/lixus-contract";

export type ReadinessStatus = "pass" | "warn" | "fail";

export type ReadinessCheck = {
  id: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
};

export type ReadinessReport = {
  overall: ReadinessStatus;
  checks: ReadinessCheck[];
};

function statusRank(status: ReadinessStatus) {
  if (status === "fail") {
    return 2;
  }

  if (status === "warn") {
    return 1;
  }

  return 0;
}

function getOverall(checks: ReadinessCheck[]): ReadinessStatus {
  return checks.reduce<ReadinessStatus>(
    (current, check) => (statusRank(check.status) > statusRank(current) ? check.status : current),
    "pass"
  );
}

export function createLixusAgentReadinessReport(input: {
  env?: Record<string, string | undefined>;
  writePolicy?: LixusAgentWritePolicy;
  mode?: "dry_run" | "persist";
}): ReadinessReport {
  const env = input.env ?? {};
  const writePolicy = input.writePolicy ?? defaultLixusAgentWritePolicy;
  const mode = input.mode ?? "dry_run";
  const checks: ReadinessCheck[] = [
    {
      id: "database-url",
      label: "Database URL",
      status: env.DATABASE_URL ? "pass" : mode === "persist" ? "fail" : "warn",
      detail: env.DATABASE_URL
        ? "DATABASE_URL is configured."
        : "DATABASE_URL is missing. Dry-run works, but persist mode needs a real database."
    },
    {
      id: "model-gateway",
      label: "LiteLLM gateway",
      status: env.LITELLM_BASE_URL ? "pass" : "warn",
      detail: env.LITELLM_BASE_URL
        ? "LITELLM_BASE_URL is configured."
        : "LITELLM_BASE_URL is missing. Local deterministic fallback will be used."
    },
    {
      id: "guest-send-disabled",
      label: "Guest-facing send disabled",
      status: writePolicy.canSendGuestMessages === false ? "pass" : "fail",
      detail:
        writePolicy.canSendGuestMessages === false
          ? "Outbound guest messaging is blocked by policy."
          : "Outbound guest messaging must stay disabled until inbox send is explicitly reviewed."
    },
    {
      id: "approval-items",
      label: "Approval queue",
      status: writePolicy.canCreateApprovalItems ? "pass" : "warn",
      detail: writePolicy.canCreateApprovalItems
        ? "Human review records can be created."
        : "Approval records are disabled, so risky replies can only be simulated."
    },
    {
      id: "suggested-tasks",
      label: "Suggested tasks",
      status: writePolicy.canCreateSuggestedTasks ? "pass" : "warn",
      detail: writePolicy.canCreateSuggestedTasks
        ? "Suggested task creation is allowed by policy."
        : "Suggested task creation is disabled by policy."
    },
    {
      id: "report-signals",
      label: "Report signals",
      status: writePolicy.canCreateReportSignals ? "pass" : "warn",
      detail: writePolicy.canCreateReportSignals
        ? "Report signal creation is allowed by policy."
        : "Report signal creation is disabled by policy."
    }
  ];

  return {
    overall: getOverall(checks),
    checks
  };
}
