import { LixusInboundPanel } from "./lixus-inbound-panel";

export default function InboxPage() {
  return (
    <div className="page">
      <section>
        <p className="eyebrow">Inbox Agent</p>
        <h1>Lixus inbound mesajini kontrollu agent akisina sok</h1>
        <p className="muted">
          Bu ekran gercek inbox entegrasyonuna hazirliktir. Misafir mesajini analiz eder, operasyon planini
          uretir, policy guard uygular ve sonucu dry-run olarak gosterir. Misafire mesaj gonderimi kapali kalir.
        </p>
      </section>

      <LixusInboundPanel />
    </div>
  );
}
