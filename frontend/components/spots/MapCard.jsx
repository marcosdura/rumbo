"use client"

import { useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function MapCard({ lat, lng, name }) {
  if (!lat || !lng) return null

  // instanceId changes on every component mount (including HMR), so the wrapper
  // div always gets a fresh key → Leaflet never finds an existing _leaflet_id
  const [instanceId] = useState(() => Math.random().toString(36).slice(2, 8))
  const mapKey = `${instanceId}-${lat}-${lng}`

  const position = [lat, lng]
  const directionsUrl = `https://www.google.com/maps/search/${encodeURIComponent(name)}/@${lat},${lng},13z`

  return (
    <div style={{
      background: "#fff",
      border: "1px solid var(--border)",
      borderRadius: 20,
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <style>{`
        .mapcard-btn {
          margin: 12px auto 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: var(--primary-dark);
          border: none;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 999px;
          cursor: pointer;
          letter-spacing: 0.03em;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.22s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @media (hover: hover) {
          .mapcard-btn:hover {
            background: var(--primary);
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(27, 67, 50, 0.28);
          }
        }
        .mapcard-map-wrap { height: 260px; }
        @media (max-width: 640px) {
          .mapcard-btn { width: 100%; margin: 12px 0 0; padding: 12px 20px; font-size: 14px; }
          .mapcard-map-wrap { height: 200px; }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
        <h3 style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "var(--primary)", margin: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Ubicación
        </h3>
      </div>

      {/* key on the wrapper div forces a full DOM teardown when lat/lng or instance changes */}
      <div
        key={mapKey}
        className="mapcard-map-wrap"
        style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}
      >
        <MapContainer
          center={position}
          zoom={8}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
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

      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mapcard-btn"
      >
        <span>📍</span>
        <span>Abrir en Google Maps</span>
      </a>
    </div>
  )
}

export default MapCard
