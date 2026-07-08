export default function HomePage() {
  return (
    <div className="page">
      <section>
        <p className="eyebrow">Buyuk Agent Sistemi</p>
        <h1>Misafir mesajindan operasyona giden kontrollu agent katmani</h1>
        <p className="muted">
          Bu branch Lixus AI icin buyuk agent sisteminin ilk omurgasini ekler: LiteLLM gateway,
          gorev cikarma, risk/onay kapisi ve operasyon raporu agentlari.
        </p>
      </section>

      <div className="grid two">
        <div className="card">
          <h2>Inbox Runner</h2>
          <p className="muted">
            Gercek Lixus inbox event'ini agent context'ine cevirir, plan uretir ve outbound send'i kapali tutarak
            dry-run sonucunu operator icin okunur hale getirir.
          </p>
        </div>
        <div className="card">
          <h2>Gorev Agenti</h2>
          <p className="muted">
            Misafir mesajindan temizlik, bakim, check-in ve sikayet gorevlerini cikarir.
            Riskli konularda misafire otomatik cevap gondermeden insan onayina duser.
          </p>
        </div>
        <div className="card">
          <h2>Rapor Agenti</h2>
          <p className="muted">
            Gorev, mesaj ve risk metriklerinden haftalik operasyon icgorusu uretir.
            Mulk bazli tekrar eden sorunlari rapora tasir.
          </p>
        </div>
      </div>
    </div>
  );
}
