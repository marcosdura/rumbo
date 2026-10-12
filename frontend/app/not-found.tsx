import type { Metadata } from "next"
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import SearchBar from "@/components/spots/SearchBar"

// Dirección mal escrita, lugar dado de baja o link viejo. Antes salía la
// pantalla de Next en inglés, sin navbar ni salida. Sin llamadas a la API:
// se tiene que ver aunque el backend esté caído.
export const metadata: Metadata = {
  title: "Página no encontrada | Rumbo",
  robots: { index: false },
}

const button = {
  borderRadius: 12, padding: "11px 22px", fontSize: 14, fontWeight: 600, textDecoration: "none",
} as const

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: 640, width: "100%", margin: "0 auto", padding: "64px 16px", textAlign: "center" }}>
        <p style={{ fontSize: 40, margin: "0 0 8px" }} aria-hidden="true">🧭</p>
        <h1 style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 600, color: "#1b1b19", margin: "0 0 10px" }}>
          No encontramos esta página
        </h1>
        <p style={{ fontSize: 15, color: "var(--muted-strong)", lineHeight: 1.5, margin: "0 0 28px" }}>
          Puede que el link esté mal escrito o que el lugar ya no esté publicado.
        </p>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <SearchBar />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ ...button, background: "var(--primary)", color: "#fff" }}>Ir al inicio</Link>
          <Link href="/search" style={{ ...button, background: "#fff", color: "var(--primary)", border: "1px solid var(--primary)" }}>Ver todos los lugares</Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
