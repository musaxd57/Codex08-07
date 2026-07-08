import { describe, expect, it } from "vitest";
import { createLixusAgentReadinessReport } from "@/lib/integrations/readiness-check";

describe("readiness check", () => {
  it("warns for missing model gateway in dry-run mode without failing overall", () => {
    const report = createLixusAgentReadinessReport({
      env: {},
      mode: "dry_run"
    });

    expect(report.overall).toBe("warn");
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "database-url", status: "warn" }),
        expect.objectContaining({ id: "model-gateway", status: "warn" }),
        expect.objectContaining({ id: "guest-send-disabled", status: "pass" })
      ])
    );
  });

  it("fails persist readiness when database is missing", () => {
    const report = createLixusAgentReadinessReport({
      env: {},
      mode: "persist"
    });

    expect(report.overall).toBe("fail");
    expect(report.checks).toEqual(expect.arrayContaining([expect.objectContaining({ id: "database-url", status: "fail" })]));
  });
});
