import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { LAST_UPDATED, SECTIONS } from "./content"

// Qué es Rumbo, privacidad, términos y contacto. Antes era un acordeón de
// cliente: los links del footer (/legal#privacidad) caían en una sección
// cerrada y un scrollTo(0, 0) los mandaba arriba. Ahora todo está abierto,
// con un índice, y se arma en el servidor (tiene título propio).
export const metadata: Metadata = {
  title: "Legal e información | Rumbo",
  description: "Qué es Rumbo, cómo tratamos tus datos, los términos de uso y cómo contactarnos.",
  alternates: { canonical: "/legal" },
  openGraph: { url: "/legal" },
}

export default function LegalPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`
        .legal-wrapper { max-width: 720px; width: 100%; margin: 0 auto; padding: 40px 24px 64px; box-sizing: border-box; }
        .legal-page-title {
          font-family: var(--font-playfair-display), serif;
          font-size: 36px; font-weight: 600; color: #1b1b19; margin: 0; line-height: 1.2;
        }
        .legal-updated { font-size: 13px; color: var(--muted); margin: 6px 0 0; }

        .legal-toc { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 24px; padding: 0; list-style: none; }
        .legal-toc a {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; color: var(--primary-dark); text-decoration: none;
          background: #fff; border: 1px solid var(--border); border-radius: 999px; padding: 7px 14px;
          transition: background 0.15s, border-color 0.15s;
        }
        @media (hover: hover) { .legal-toc a:hover { background: #e8f5ee; border-color: #b7dfc8; } }

        .legal-item {
          background: #fff; border: 1px solid var(--border); border-radius: 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04); padding: 22px 24px 24px;
          scroll-margin-top: 100px;
        }
        .legal-item:target { border-color: var(--primary); }
        .legal-item-title {
          display: flex; align-items: center; gap: 12px;
          font-size: 18px; font-weight: 600; color: #1b1b19; margin: 0 0 16px;
        }
        .legal-emoji { font-size: 20px; line-height: 1; }

        .legal-intro {
          font-size: 14px; color: var(--muted-strong); font-style: italic; line-height: 1.6;
          margin: 0 0 20px; padding-bottom: 16px; border-bottom: 1px solid #ede9e1;
        }
        .legal-subtitle {
          font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--primary); margin: 20px 0 8px;
        }
        .legal-p { font-size: 14px; color: #4a443b; line-height: 1.7; margin: 0 0 10px; }
        .legal-p:last-child { margin-bottom: 0; }
        .legal-list { font-size: 14px; color: #4a443b; line-height: 1.7; margin: 0 0 10px; padding-left: 18px; }
        .legal-list li { margin-bottom: 4px; }
        .legal-list strong { color: #1b1b19; font-weight: 600; }
        .legal-link { color: var(--primary); font-weight: 600; }

        @media (max-width: 640px) {
          .legal-wrapper { padding: 24px 16px 48px; }
          .legal-page-title { font-size: 28px; }
          .legal-item { padding: 18px 16px 20px; }
          .legal-p, .legal-list { font-size: 13px; }
        }
      `}</style>

      <Navbar />

      <main id="contenido" style={{ flex: 1 }}>
        <div className="legal-wrapper">
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
                Información
              </p>
            </div>
            <h1 className="legal-page-title">Legal e información</h1>
            <p className="legal-updated">Última actualización: {LAST_UPDATED}</p>
          </div>

          <nav aria-label="Secciones">
            <ul className="legal-toc">
              {SECTIONS.map(s => (
                <li key={s.id}><a href={`#${s.id}`}><span aria-hidden="true">{s.emoji}</span> {s.title}</a></li>
              ))}
            </ul>
          </nav>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SECTIONS.map(s => (
              <section key={s.id} id={s.id} className="legal-item" aria-labelledby={`${s.id}-title`}>
                <h2 id={`${s.id}-title`} className="legal-item-title">
                  <span className="legal-emoji" aria-hidden="true">{s.emoji}</span> {s.title}
                </h2>
                {s.content}
              </section>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
