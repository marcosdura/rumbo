"use client"

import { useState } from "react"
import { retryFailures, type Failure } from "./submit"
import { s } from "./styles"

// En la pantalla final: lo que se creó pero con partes que no se pudieron
// guardar (una foto, un sector, una ruta...). Se nombra cada una y se puede
// reintentar sin volver a crear el lugar.
export default function FailuresNotice({ failures, onChange }: {
  failures: Failure[]
  onChange: (still: Failure[]) => void
}) {
  const [retrying, setRetrying] = useState(false)
  const [retried, setRetried] = useState(false)

  if (failures.length === 0) {
    return retried
      ? <p role="status" style={{ fontSize: 14, color: "var(--primary)", margin: "0 auto 28px" }}>Listo, se guardó todo.</p>
      : null
  }

  async function retry() {
    setRetrying(true)
    const still = await retryFailures(failures)
    setRetrying(false)
    setRetried(true)
    onChange(still)
  }

  return (
    <div role="alert" style={{
      background: "#fdf6ec", border: "1px solid #f0d9b5", borderRadius: 16, padding: "16px 20px",
      maxWidth: 440, margin: "0 auto 28px", textAlign: "left",
    }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: "0 0 8px" }}>
        {retried ? "Todavía no se pudo guardar:" : "Esto no se pudo guardar:"}
      </p>
      <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontSize: 14, color: "#3d3d3a", lineHeight: 1.6 }}>
        {failures.map((f, i) => <li key={i}>{f.label}</li>)}
      </ul>
      <button style={{ ...s.btnPrimary, opacity: retrying ? 0.7 : 1 }} onClick={retry} disabled={retrying}>
        {retrying ? "Reintentando..." : "Reintentar lo que faltó"}
      </button>
    </div>
  )
}
