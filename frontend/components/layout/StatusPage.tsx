import type { ReactNode } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

// La 404 (app/not-found) y el error (app/error): navbar, un mensaje y salidas.
export default function StatusPage({ emoji, title, text, children }: {
  emoji: string; title: string; text: string; children: ReactNode
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: 640, width: "100%", margin: "0 auto", padding: "64px 16px", textAlign: "center" }}>
        <p style={{ fontSize: 40, margin: "0 0 8px" }} aria-hidden="true">{emoji}</p>
        <h1 style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 600, color: "#1b1b19", margin: "0 0 10px" }}>
          {title}
        </h1>
        <p style={{ fontSize: 15, color: "var(--muted-strong)", lineHeight: 1.5, margin: "0 0 28px" }}>{text}</p>
        {children}
      </main>
      <Footer />
    </div>
  )
}

// Botones de salida: el principal (verde) y el secundario (con borde), como
// el "Reintentar" de la home.
const base = {
  borderRadius: 12, padding: "11px 22px", fontSize: 14, fontWeight: 600, textDecoration: "none",
  fontFamily: "inherit", cursor: "pointer", display: "inline-block",
} as const
export const primaryButton = { ...base, background: "var(--primary)", color: "#fff", border: "1px solid var(--primary)" } as const
export const secondaryButton = { ...base, background: "#fff", color: "var(--primary)", border: "1px solid var(--primary)" } as const
