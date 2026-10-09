"use client"

// El recorrido de una ruta de trekking (backend/route_tracks.py): el mapa y
// "Descargar GPX", o la invitación a subirlo. Lo sube cualquiera con sesión
// y pasa por revisión del admin.
import { useState } from "react"
import dynamic from "next/dynamic"
import { useSession } from "next-auth/react"
import ConfirmModal from "@/components/ui/ConfirmModal"
import AuthModal from "@/components/layout/AuthModal"
import { api, ApiError } from "@/lib/api"
import { gpxFileName, parseGpx, simplify, toGpx, type TrackPoint } from "@/lib/gpx"
import type { RouteTrackData } from "@/lib/trailPage"

const TrackMap = dynamic(() => import("./TrackMap"), { ssr: false })

const button = {
  padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
  border: "1px solid var(--border)", background: "#fff", color: "var(--primary)", cursor: "pointer", whiteSpace: "nowrap" as const,
}

const km = (n: number) => `${n.toLocaleString("es-UY", { maximumFractionDigits: 1 })} km`

type Props = {
  routeId: number
  routeName: string
  routeSlug: string | null
  track: RouteTrackData | null
  // Hay uno en revisión: no se ofrece subir otro.
  pending: boolean
}

export default function RouteTrack({ routeId, routeName, routeSlug, track, pending }: Props) {
  const { data: session } = useSession()
  const token = session?.id_token
  const [showAuth, setShowAuth] = useState(false)
  const [open, setOpen] = useState(false)
  const [points, setPoints] = useState<TrackPoint[] | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  function start() {
    if (!token) { setShowAuth(true); return }
    setPoints(null)
    setError(null)
    setOpen(true)
  }

  async function pick(file: File | undefined) {
    setPoints(null)
    if (!file) return
    const parsed = parseGpx(await file.text())
    if (!parsed) { setError("No encontramos un recorrido en ese archivo. Tiene que ser un GPX."); return }
    setError(null)
    setPoints(simplify(parsed))
  }

  async function send() {
    if (!points) { setError("Elegí el archivo GPX del recorrido."); return }
    setSending(true)
    setError(null)
    try {
      await api.post(`/routes/${routeId}/track`, { points }, { token })
      setSent(true)
      setOpen(false)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo subir el recorrido. Intentá de nuevo.")
    } finally {
      setSending(false)
    }
  }

  function download() {
    if (!track) return
    const blob = new Blob([toGpx(routeName, track.points)], { type: "application/gpx+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = gpxFileName(routeSlug, routeName)
    a.click()
    URL.revokeObjectURL(url)
  }

  if (track) {
    const facts = [
      track.distance_km != null ? km(track.distance_km) : null,
      track.elevation_gain != null ? `↑ ${track.elevation_gain} m` : null,
      track.elevation_loss != null ? `↓ ${track.elevation_loss} m` : null,
    ].filter(Boolean)
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <TrackMap points={track.points} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "var(--muted-strong)" }}>{facts.join(" · ")}</span>
          <button type="button" style={button} onClick={download}>⬇ Descargar GPX</button>
        </div>
      </div>
    )
  }

  if (pending || sent) {
    return (
      <p role="status" style={{ fontSize: 14, color: "#78590a", margin: 0, lineHeight: 1.5 }}>
        ⏳ {sent ? "¡Gracias! El recorrido queda" : "Hay un recorrido"} en revisión: se publica cuando el equipo de Rumbo lo apruebe.
      </p>
    )
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <p style={{ fontSize: 14, color: "var(--muted-strong)", margin: 0, lineHeight: 1.5, flex: "1 1 260px" }}>
          Todavía no está el recorrido en el mapa. ¿Lo tenés grabado? Subí el GPX (lo exportan Wikiloc, Strava, Garmin y las apps de celular).
        </p>
        <button type="button" style={button} onClick={start}>＋ Subir el recorrido (GPX)</button>
      </div>

      <ConfirmModal
        open={open}
        title={`Recorrido de ${routeName}`}
        confirmLabel="Subir recorrido"
        confirmVariant="primary"
        loading={sending}
        loadingLabel="Subiendo..."
        error={error}
        onCancel={() => setOpen(false)}
        onConfirm={send}
      >
        <p style={{ fontSize: 14, color: "#4a4a46", lineHeight: 1.6, margin: "8px 0 12px" }}>
          Elegí el archivo GPX de la ruta. Pasa por revisión antes de publicarse.
        </p>
        <input type="file" accept=".gpx,application/gpx+xml" aria-label="Elegir archivo GPX" onChange={e => pick(e.target.files?.[0])} />
        {points && (
          <p style={{ fontSize: 13, color: "var(--muted-strong)", margin: "10px 0 0" }}>✓ Recorrido de {points.length} puntos listo para subir.</p>
        )}
      </ConfirmModal>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
