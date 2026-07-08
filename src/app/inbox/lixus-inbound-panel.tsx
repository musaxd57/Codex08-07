"use client";

import { useMemo, useState } from "react";

type WritePolicy = {
  canCreateSuggestedTasks: boolean;
  canCreateApprovalItems: boolean;
  canCreateReportSignals: boolean;
  canSendGuestMessages: false;
};

type InboundResult = {
  analysis: {
    intent: string;
    riskLevel: string;
    confidence: number;
    guestReplyDraft: string;
    requiresHumanApproval: boolean;
  };
  plan: {
    automationMode: string;
    steps: Array<{
      tool: string;
      title: string;
      reason: string;
      status: string;
    }>;
  };
  execution: {
    mode: "dry_run" | "persist";
    executedCount: number;
    queuedForHumanCount: number;
    skippedCount: number;
  };
  operatorSummary: {
    headline: string;
    actions: Array<{ label: string; value: string | number; tone: "low" | "medium" | "high" }>;
    timeline: Array<{ title: string; detail: string; status: string; tone: "low" | "medium" | "high" }>;
    warnings: string[];
  };
  outbound: {
    status: "blocked";
    reason: string;
  };
};

const sampleMessage = {
  tenantId: "demo-tenant",
  messageId: "demo-message",
  conversationId: "demo-conversation",
  body: "Kapi sifresi calismiyor, disarida kaldik. Hemen yardim eder misiniz?",
  channel: "AIRBNB",
  guest: { id: "guest-1", name: "Demo Misafir", language: "tr" },
  property: {
    id: "galata-loft",
    name: "Galata Loft",
    city: "Istanbul",
    houseRules: "Sigara yasak. Check-in 15:00 sonrasi.",
    checkInGuide: "Ana giris kodu rezervasyon gunu gonderilir."
  },
  reservation: {
    id: "reservation-1",
    checkIn: "2026-07-08",
    checkOut: "2026-07-11",
    status: "confirmed"
  },
  recentMessages: [{ author: "GUEST", body: "Merhaba, check-in bilgisi nerede?" }]
};

const defaultPolicy: WritePolicy = {
  canCreateSuggestedTasks: true,
  canCreateApprovalItems: true,
  canCreateReportSignals: true,
  canSendGuestMessages: false
};

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function LixusInboundPanel() {
  const [payload, setPayload] = useState(prettyJson(sampleMessage));
  const [policy, setPolicy] = useState<WritePolicy>(defaultPolicy);
  const [mode, setMode] = useState<"dry_run" | "persist">("dry_run");
  const [result, setResult] = useState<InboundResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parsedPayload = useMemo(() => {
    try {
      return JSON.parse(payload) as unknown;
    } catch {
      return null;
    }
  }, [payload]);

  function updatePolicy(key: keyof Omit<WritePolicy, "canSendGuestMessages">) {
    setPolicy((current) => ({
      ...current,
      [key]: !current[key]
    }));
  }

  async function runInboundAgent() {
    setError(null);
    setResult(null);

    if (!parsedPayload) {
      setError("Payload JSON formatinda degil.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/agents/lixus-inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: parsedPayload,
          mode,
          writePolicy: policy
        })
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Inbound agent calistirilamadi.");
      }

      setResult(body as InboundResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Beklenmeyen inbound agent hatasi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid two">
      <div className="card stack">
        <div>
          <h2>Inbound Payload</h2>
          <p className="muted">Lixus inbox event formatina benzeyen payload. Varsayilan mod dry-run.</p>
        </div>

        <textarea rows={18} value={payload} onChange={(event) => setPayload(event.target.value)} />

        <div className="stack compact">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={policy.canCreateSuggestedTasks}
              onChange={() => updatePolicy("canCreateSuggestedTasks")}
            />
            Suggested task kaydi olusturulabilir
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={policy.canCreateApprovalItems}
              onChange={() => updatePolicy("canCreateApprovalItems")}
            />
            Approval item kaydi olusturulabilir
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={policy.canCreateReportSignals}
              onChange={() => updatePolicy("canCreateReportSignals")}
            />
            Report signal kaydi olusturulabilir
          </label>
          <label className="checkbox-row disabled">
            <input type="checkbox" checked={false} disabled />
            Guest-facing send kapali
          </label>
        </div>

        <div className="toolbar">
          <select value={mode} onChange={(event) => setMode(event.target.value as "dry_run" | "persist")}>
            <option value="dry_run">Dry run</option>
            <option value="persist">Persist</option>
          </select>
          <button className="button" onClick={runInboundAgent} disabled={isLoading}>
            {isLoading ? "Calisiyor..." : "Inbound Agent Calistir"}
          </button>
        </div>

        {mode === "persist" ? (
          <div className="notice medium">
            Persist modu gercek DB iliskileri ister. Demo icin dry-run daha guvenlidir.
          </div>
        ) : null}
        {error ? <div className="notice high">{error}</div> : null}
      </div>

      <div className="card stack">
        <div>
          <h2>Operator Sonucu</h2>
          <p className="muted">Agent aksiyonlari ve bloke edilen outbound durumunu burada gorursun.</p>
        </div>

        {result ? (
          <div className="stack">
            <div className="notice medium">{result.operatorSummary.headline}</div>

            <div className="summary-grid">
              {result.operatorSummary.actions.map((item) => (
                <div key={item.label}>
                  <span className="muted">{item.label}</span>
                  <strong className={item.tone}>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="notice high">
              {result.outbound.status}: {result.outbound.reason}
            </div>

            <div className="stack compact">
              {result.operatorSummary.timeline.map((item) => (
                <article className="step-row" key={`${item.status}-${item.title}`}>
                  <div>
                    <span className={`badge ${item.tone}`}>{item.status}</span>
                    <h3>{item.title}</h3>
                    <p className="muted">{item.detail}</p>
                  </div>
                </article>
              ))}
            </div>

            {result.operatorSummary.warnings.length ? (
              <div className="notice medium">
                {result.operatorSummary.warnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            ) : null}

            <details>
              <summary>Ham sonuc</summary>
              <pre>{prettyJson(result)}</pre>
            </details>
          </div>
        ) : (
          <div className="notice">Henüz calistirilmis inbound agent sonucu yok.</div>
        )}
      </div>
    </div>
  );
}
