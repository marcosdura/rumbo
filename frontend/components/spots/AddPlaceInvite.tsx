import Link from "next/link"

// En la home, entre las colecciones: invita a sumar lugares que faltan.
// Cualquiera puede (como responsable o como visitante que lo conoce).
export default function AddPlaceInvite() {
  return (
    <section style={{ paddingTop: 32, fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <div style={{
        background: "#fff", border: "1px solid var(--border)", borderRadius: 20, padding: "24px 28px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      }}>
        <div style={{ minWidth: 0, flex: "1 1 280px" }}>
          <p style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 22, fontWeight: 600, color: "#1b1b19", margin: "0 0 6px" }}>
            ¿Conocés un lugar que no está?
          </p>
          <p style={{ fontSize: 14, color: "var(--muted-strong)", margin: 0, lineHeight: 1.5 }}>
            Sumalo a Rumbo, seas el responsable o lo conozcas como visitante. Lo revisamos antes de publicarlo.
          </p>
        </div>
        <Link href="/agregar-lugar" style={{
          background: "var(--primary)", color: "#fff", borderRadius: 12, padding: "11px 22px",
          fontSize: 14, fontWeight: 600, textDecoration: "none", flexShrink: 0,
        }}>
          ＋ Agregar lugar
        </Link>
      </div>
    </section>
  )
}
