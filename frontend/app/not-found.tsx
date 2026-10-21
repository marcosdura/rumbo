import type { Metadata } from "next"
import Link from "next/link"
import StatusPage, { primaryButton, secondaryButton } from "@/components/layout/StatusPage"
import SearchBar from "@/components/spots/SearchBar"

// Dirección mal escrita, lugar dado de baja o link viejo. Antes salía la
// pantalla de Next en inglés, sin navbar ni salida. Sin llamadas a la API:
// se tiene que ver aunque el backend esté caído.
export const metadata: Metadata = {
  title: "Página no encontrada | Rumbo",
  robots: { index: false },
}

export default function NotFound() {
  return (
    <StatusPage emoji="🧭" title="No encontramos esta página" text="Puede que el link esté mal escrito o que el lugar ya no esté publicado.">
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <SearchBar />
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/" className="btn-hover" style={primaryButton}>Ir al inicio</Link>
        <Link href="/search" className="btn-hover" style={secondaryButton}>Ver todos los lugares</Link>
      </div>
    </StatusPage>
  )
}
