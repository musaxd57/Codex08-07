import { createLixusAgentReadinessReport } from "@/lib/integrations/readiness-check";

const statusClass = {
  pass: "low",
  warn: "medium",
  fail: "high"
} as const;

export default function ReadinessPage() {
  const report = createLixusAgentReadinessReport({
    env: {
      DATABASE_URL: process.env.DATABASE_URL,
      LITELLM_BASE_URL: process.env.LITELLM_BASE_URL
    },
    mode: "dry_run"
  });

  return (
    <div className="page">
      <section>
        <p className="eyebrow">Readiness</p>
        <h1>Production baglantisi oncesi agent guvenlik kontrolu</h1>
        <p className="muted">
          Bu sayfa Lixus agent katmaninin hangi parcalarinin hazir oldugunu, hangi parcalarin dry-run/fallback
          modunda kaldigini ve guest-facing send'in kapali oldugunu gosterir.
        </p>
      </section>

      <div className="card stack">
        <div className="summary-grid">
          <div>
            <span className="muted">Overall</span>
            <strong className={statusClass[report.overall]}>{report.overall}</strong>
          </div>
          <div>
            <span className="muted">Checks</span>
            <strong>{report.checks.length}</strong>
          </div>
          <div>
            <span className="muted">Guest send</span>
            <strong className="low">blocked</strong>
          </div>
        </div>

        <div className="stack compact">
          {report.checks.map((check) => (
            <article className="step-row" key={check.id}>
              <div>
                <span className={`badge ${statusClass[check.status]}`}>{check.status}</span>
                <h3>{check.label}</h3>
                <p className="muted">{check.detail}</p>
              </div>
              <code>{check.id}</code>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
