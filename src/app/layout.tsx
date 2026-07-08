import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Lixus AI Agent System",
  description: "Large agent system branch for Lixus AI hospitality operations."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div>
              <p className="eyebrow">Lixus AI</p>
              <h1>Agent Ops</h1>
            </div>
            <nav>
              <a href="/">Genel Bakis</a>
              <a href="/inbox">Inbox</a>
              <a href="/tasks">Gorevler</a>
              <a href="/reports">Raporlar</a>
              <a href="/readiness">Readiness</a>
            </nav>
          </aside>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
