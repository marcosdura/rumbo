"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"



// fix del icono que rompe Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function MapCard({ lat, lng, name }) {
  const position = [lat ?? -34.906, lng ?? -56.164]
  const directionsUrl = `https://www.google.com/maps/search/${encodeURIComponent(name)}/@${lat},${lng},13z`

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e0ddd6",
      borderRadius: 20,
      padding: "20px",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
        <h3 style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "#2d6a4f", margin: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Ubicación
        </h3>
      </div>

      <div style={{ flex: 1, borderRadius: 14, overflow: "hidden", border: "1px solid #e0ddd6", minHeight: 220 }}>
        <MapContainer
          center={position}
          zoom={8}
          style={{ height: "100%", minHeight: 220, width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Marker position={position} icon={icon}>
            <Popup>{name}</Popup>
          </Marker>
        </MapContainer>
      </div>

        <a href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            margin: "12px auto 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginTop: 12,
            background: "#1b4332",
            border: "none",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            padding: "10px 20px",
            borderRadius: 999,
            cursor: "pointer",
            letterSpacing: "0.03em",
            textDecoration: "none",
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#2d6a4f"
            e.currentTarget.style.transform = "translateY(-1px)"
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(27, 67, 50, 0.28)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "#1b4332"
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "none"
          }}
        >
          <span>📍</span>
          <span>Abrir en Google Maps</span>
        </a>
    </div>
  )
}

export default MapCard