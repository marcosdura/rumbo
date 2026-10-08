"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Pill from "@/components/ui/Pill"
import { api } from "@/lib/api"
import { requestDetail, requestLinkLabel, requestTitle, type MyRequest } from "@/lib/requests"
import { s } from "./styles"
import { ctaLink } from "./MySpotsCard"

const STATUS_PILL = {
  pending: { variant: "yellow", label: "En revisión" },
  approved: { variant: "green", label: "Aprobado" },
  rejected: { variant: "red", label: "Rechazado" },
} as const

// "Mis pedidos": lo que pediste y espera revisión, y lo resuelto hasta que
// cerrás el aviso. Mismas filas que "Tus aportes".
export default function MyRequestsCard({ token }: { token: string }) {
  const [items, setItems] = useState<MyRequest[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get<MyRequest[]>("/me/requests", { token })
      .then(({ data }) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setError(true))
  }, [token])

  async function dismiss(r: MyRequest) {
    try {
      await api.post(r.dismiss_url, undefined, { token })
      setItems(prev => (prev ?? []).filter(i => !(i.kind === r.kind && i.id === r.id)))
    } catch {
      // Si falla, el aviso sigue ahí y se puede volver a cerrar.
    }
  }

  return (
    <div className="fade-up fade-up-3" style={{ ...s.card, padding: "20px" }}>
      {error ? (
        <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>No se pudieron cargar tus pedidos. Recargá la página.</p>
      ) : items === null ? (
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Cargando...</p>
      ) : items.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--muted-strong)", margin: 0, lineHeight: 1.5 }}>
          No tenés pedidos. Acá vas a ver los cambios que pidas en tus lugares o escuelas (nombre, descripción, fotos)
          y los pedidos para hacerte cargo de un lugar, mientras se revisan y cuando se resuelvan.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map(r => {
            const pill = STATUS_PILL[r.status]
            const detail = requestDetail(r)
            return (
              <div key={`${r.kind}-${r.id}`} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid #ede9e1" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: "0 0 2px" }}>{requestTitle(r)}</p>
                  {detail && <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 4px" }}>{detail}</p>}
                  {pill && <Pill variant={pill.variant} size="sm">{pill.label}</Pill>}
                  {r.status === "rejected" && r.reject_reason && (
                    <p style={{ fontSize: 12, color: "#7c1d1d", margin: "6px 0 0", lineHeight: 1.5 }}>Motivo: {r.reject_reason}</p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {r.target.href && <Link href={r.target.href} style={ctaLink}>{requestLinkLabel(r)}</Link>}
                  {r.status !== "pending" && (
                    // Misma X que el cierre de "Tus aportes".
                    <button
                      onClick={() => dismiss(r)}
                      aria-label={`Cerrar aviso de ${requestTitle(r)}`}
                      style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, border: "1px solid var(--border)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, color: "var(--muted)", fontFamily: "inherit" }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
