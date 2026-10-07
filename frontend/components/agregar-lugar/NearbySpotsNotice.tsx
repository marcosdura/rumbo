"use client"

// Al marcar la ubicación de un lugar nuevo: si ya hay lugares publicados a
// menos de 1 km, se avisa "¿Es alguno de estos?" para no cargar uno que ya
// existe con otro nombre. Es solo un aviso: puede ser otro lugar al lado.
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export type NearbySpot = { id: number; name: string; slug: string | null; category: string | null; distance_m: number }

const DEBOUNCE_MS = 400

export function formatDistance(m: number): string {
  return m < 1000 ? `a ${Math.max(10, Math.round(m / 10) * 10)} m` : `a ${(m / 1000).toFixed(1)} km`
}

export default function NearbySpotsNotice({ lat, lng }: { lat: string; lng: string }) {
  const key = lat && lng ? `${lat},${lng}` : null
  // Los resultados guardan para qué punto eran: si se mueve el pin, no se
  // muestran los del punto anterior.
  const [found, setFound] = useState<{ key: string; spots: NearbySpot[] } | null>(null)

  useEffect(() => {
    if (!key) return
    const timer = setTimeout(() => {
      api.get<NearbySpot[]>("/spots/nearby", { params: { lat, lng } })
        .then(({ data }) => setFound({ key, spots: Array.isArray(data) ? data : [] }))
        .catch(() => {})  // sin el aviso se puede cargar igual
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [key, lat, lng])

  const spots = found && found.key === key ? found.spots : []
  if (spots.length === 0) return null

  return (
    <div role="status" style={{
      background: "#fdf6ec", border: "1px solid #f0d9b5", borderRadius: 12, padding: "12px 14px", marginTop: 10,
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19", margin: "0 0 6px" }}>
        Cerca de este punto ya {spots.length === 1 ? "hay un lugar publicado" : "hay lugares publicados"}. ¿Es alguno de estos?
      </p>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#3d3d3a", lineHeight: 1.7 }}>
        {spots.map(sp => (
          <li key={sp.id}>
            {sp.slug
              ? <a href={`/spots/${sp.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>{sp.name}</a>
              : sp.name}
            {sp.category && ` (${sp.category})`} — {formatDistance(sp.distance_m)}
          </li>
        ))}
      </ul>
      <p style={{ fontSize: 12, color: "var(--muted-strong)", margin: "6px 0 0" }}>
        Si es el mismo lugar, no hace falta cargarlo de nuevo. Si es otro, seguí normalmente.
      </p>
    </div>
  )
}
