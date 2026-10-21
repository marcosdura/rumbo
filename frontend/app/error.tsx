"use client"

import Link from "next/link"
import StatusPage, { primaryButton, secondaryButton } from "@/components/layout/StatusPage"

// Algo falló al armar la página (casi siempre la API caída o reiniciando).
// Antes salía "Application error" de Next sin forma de seguir. Reintentar
// vuelve a pedir los datos (unstable_retry), sin recargar todo.
export default function ErrorPage({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <StatusPage emoji="⛺" title="Algo salió mal" text="No pudimos cargar esta página. Puede ser algo pasajero: probá de nuevo en unos segundos.">
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn-hover" onClick={() => unstable_retry()} style={primaryButton}>Reintentar</button>
        <Link href="/" className="btn-hover" style={secondaryButton}>Ir al inicio</Link>
      </div>
    </StatusPage>
  )
}
