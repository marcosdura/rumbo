"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Pill from "@/components/ui/Pill"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { api } from "@/lib/api"
import { KIND_LABELS, type Contribution } from "@/lib/contributions"
import { s } from "./styles"
import { ctaLink } from "./MySpotsCard"

interface Props {
  token: string | undefined
}

const STATUS_PILL = {
  pending: { variant: "yellow", label: "En revisión" },
  approved: { variant: "green", label: "Aprobado" },
  rejected: { variant: "red", label: "Rechazado" },
} as const

// "Tus aportes": lo que sumaste a lugares ya aprobados (tuyos, o sectores y
// vías de escalada en lugares ajenos) y cómo terminó la revisión. Los
// aprobados y rechazados quedan hasta que cerrás el aviso.
export default function MyContributionsCard({ token }: Props) {
  const [items, setItems] = useState<Contribution[] | null>(null)
  const [toWithdraw, setToWithdraw] = useState<Contribution | null>(null)
  const [busy, setBusy] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api.get<Contribution[]>("/contributions/mine", { token })
      .then(({ data }) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
  }, [token])

  async function dismiss(id: number) {
    try {
      await api.post(`/contributions/${id}/dismiss`, undefined, { token })
      setItems(prev => (prev ?? []).filter(c => c.id !== id))
    } catch {
      // Si falla, el aviso sigue ahí y se puede volver a cerrar.
    }
  }

  async function withdraw() {
    if (!toWithdraw) return
    setBusy(true)
    setWithdrawError(null)
    try {
      await api.post(`/contributions/${toWithdraw.id}/withdraw`, undefined, { token })
      setItems(prev => (prev ?? []).filter(c => c.id !== toWithdraw.id))
      setToWithdraw(null)
    } catch {
      setWithdrawError("No se pudo retirar. Intentá de nuevo.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fade-up fade-up-3" style={{ ...s.card, padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)" }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
          Tus aportes
        </p>
      </div>
      {items === null ? (
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Cargando...</p>
      ) : items.length === 0 && (
        // Siempre visible, como "Tus lugares": explica qué es un aporte.
        <div>
          <p style={{ fontSize: 13, color: "var(--muted-strong)", margin: "0 0 12px", lineHeight: 1.5 }}>
            Cuando sumes algo a un lugar ya publicado (un sector o una vía de escalada, una ruta, una experiencia), lo vas a ver acá mientras se revisa y cuando se apruebe.
          </p>
          <Link href="/agregar-lugar" style={ctaLink}>＋ Sumar algo</Link>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(items ?? []).map(c => {
          const pill = STATUS_PILL[c.status as keyof typeof STATUS_PILL]
          return (
            <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid #ede9e1" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: "0 0 2px" }}>{c.title}</p>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 4px" }}>
                  {KIND_LABELS[c.kind]} en{" "}
                  {c.spot.slug
                    ? <Link href={`/spots/${c.spot.slug}`} style={{ color: "var(--primary)", textDecoration: "none" }}>{c.spot.name}</Link>
                    : c.spot.name}
                </p>
                {pill && <Pill variant={pill.variant} size="sm">{pill.label}</Pill>}
                {c.status === "rejected" && c.reject_reason && (
                  <p style={{ fontSize: 12, color: "#7c1d1d", margin: "6px 0 0", lineHeight: 1.5 }}>Motivo: {c.reject_reason}</p>
                )}
              </div>
              {c.status === "pending" ? (
                <button
                  onClick={() => { setWithdrawError(null); setToWithdraw(c) }}
                  style={{ padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, flexShrink: 0, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "var(--danger)", border: "1px solid #fecaca" }}
                >
                  Retirar
                </button>
              ) : (
                // Misma X que el cierre de ShareModal y del aviso del dashboard.
                <button
                  onClick={() => dismiss(c.id)}
                  aria-label={`Cerrar aviso de ${c.title}`}
                  style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, border: "1px solid var(--border)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, color: "var(--muted)", fontFamily: "inherit" }}
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmModal
        open={toWithdraw !== null}
        title="¿Retirar este aporte?"
        message="Deja de estar en revisión y se borra. No se puede deshacer."
        confirmLabel="Retirar"
        cancelLabel="Volver"
        loading={busy}
        loadingLabel="Retirando..."
        error={withdrawError}
        onCancel={() => setToWithdraw(null)}
        onConfirm={withdraw}
      />
    </div>
  )
}
