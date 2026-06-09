"use client"
import { useState } from "react"
import dynamic from "next/dynamic"

const LocationPickerMap = dynamic(
  () => import("./LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div style={{
        height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#f7f5f0",
      }}>
        <p style={{ fontSize: 13, color: "#9a9690", margin: 0 }}>Cargando mapa...</p>
      </div>
    ),
  }
)

function parseGoogleMapsUrl(url) {
  // @lat,lng,Xz  —  most Google Maps share URLs
  const atMatch = url.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/)
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) }
  // ?q=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d+),(-?\d+\.?\d+)/)
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) }
  return null
}

export default function LocationPicker({ lat, lng, onLocationSelect }) {
  const [linkInput, setLinkInput]     = useState("")
  const [linkError, setLinkError]     = useState(null)
  const [linkSuccess, setLinkSuccess] = useState(false)
  const [flyTrigger, setFlyTrigger]   = useState(0)
  const [resolving, setResolving]     = useState(false)

  function handleMapSelect(newLat, newLng) {
    setLinkError(null)
    setLinkSuccess(false)
    onLocationSelect(newLat, newLng)
  }

  async function handleLinkChange(e) {
    const val = e.target.value
    setLinkInput(val)
    setLinkError(null)
    setLinkSuccess(false)
    if (!val.trim()) return

    let urlToParse = val.trim()

    // goo.gl short links — resolve server-side (CORS blocks browser fetches)
    if (urlToParse.includes("goo.gl")) {
      setResolving(true)
      try {
        const res = await fetch(`/api/resolve-url?url=${encodeURIComponent(urlToParse)}`)
        if (res.ok) {
          const data = await res.json()
          urlToParse = data.url || urlToParse
        }
      } catch {
        // fallback: try parsing the original URL
      } finally {
        setResolving(false)
      }
    }

    const coords = parseGoogleMapsUrl(urlToParse)
    if (coords) {
      onLocationSelect(coords.lat, coords.lng)
      setFlyTrigger(n => n + 1)
      setLinkSuccess(true)
    } else {
      setLinkError("No se pudo extraer la ubicación. Probá con un link largo de Google Maps.")
    }
  }

  const inputBorder = linkError ? "#e53e3e" : "#e0ddd6"

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e0ddd6",
      borderRadius: 20,
      padding: "20px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
          Ubicación <span style={{ color: "#e53e3e", fontSize: 13 }}>*</span>
        </p>
      </div>
      <p style={{ fontSize: 12, color: "#7a7669", margin: "0 0 12px" }}>
        Hacé clic en el mapa para colocar el marcador, o arrastralo para ajustarlo
      </p>

      {/* Map */}
      <div style={{
        height: 300, borderRadius: 14, overflow: "hidden",
        border: "1px solid #e0ddd6", marginBottom: 10,
      }}>
        <LocationPickerMap
          lat={lat}
          lng={lng}
          onSelect={handleMapSelect}
          flyTrigger={flyTrigger}
        />
      </div>

      {/* Coords readout */}
      <p style={{
        fontSize: 12, marginBottom: 14, minHeight: 16,
        color: lat != null ? "#2d6a4f" : "#9a9690",
      }}>
        {lat != null && lng != null
          ? `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`
          : "Sin ubicación seleccionada"}
      </p>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 1, background: "#e0ddd6" }} />
        <span style={{ fontSize: 11, color: "#9a9690", whiteSpace: "nowrap" }}>
          o pegá un link de Google Maps
        </span>
        <div style={{ flex: 1, height: 1, background: "#e0ddd6" }} />
      </div>

      {/* Link input */}
      <input
        type="text"
        placeholder="Pegar link de Google Maps..."
        value={linkInput}
        onChange={handleLinkChange}
        style={{
          width: "100%", padding: "9px 12px",
          border: `1px solid ${inputBorder}`,
          borderRadius: 12, fontSize: 14,
          background: "#fff", color: "#1b1b19",
          outline: "none", boxSizing: "border-box", fontFamily: "inherit",
        }}
      />
      {resolving  && <p style={{ fontSize: 12, color: "#9a9690", marginTop: 6 }}>Resolviendo link...</p>}
      {linkError  && <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 6 }}>{linkError}</p>}
      {linkSuccess && <p style={{ fontSize: 12, color: "#2d6a4f", marginTop: 6 }}>✓ Ubicación encontrada</p>}
    </div>
  )
}
