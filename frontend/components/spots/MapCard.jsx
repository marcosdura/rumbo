"use client"

import { useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { directionsUrl } from "@/lib/spotDetail"

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function MapCard({ lat, lng, name }) {
  // instanceId changes on every component mount (including HMR), so the wrapper
  // div always gets a fresh key → Leaflet never finds an existing _leaflet_id
  // Va antes del return: los hooks se llaman siempre, haya coordenadas o no.
  const [instanceId] = useState(() => Math.random().toString(36).slice(2, 8))

  if (!lat || !lng) return null

  const mapKey = `${instanceId}-${lat}-${lng}`

  const position = [lat, lng]

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
          font-family: var(--font-dm-sans), sans-serif;
          transition: all 0.22s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @media (hover: hover) {
          .mapcard-btn:hover {
            background: var(--primary);
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(27, 67, 50, 0.28);
          }
        }
        /* A todo el ancho de la página: más alto, y "Cómo llegar" encima del
           mapa (sobre las capas de Leaflet). En el celular va debajo: encima
           taparía buena parte de un mapa chico. */
        /* isolation: las capas de Leaflet (z-index 400 y más) quedan adentro
           del mapa; sin esto, al scrollear el mapa pasaba por encima del
           navbar fijo (z-index 100). */
        .mapcard-area { position: relative; isolation: isolate; }
        .mapcard-map-wrap { height: 380px; }
        @media (min-width: 769px) {
          .mapcard-area .mapcard-btn {
            position: absolute; left: 50%; bottom: 16px; margin: 0; z-index: 500;
            transform: translateX(-50%); box-shadow: 0 4px 16px rgba(0,0,0,0.2);
          }
        }
        @media (min-width: 769px) and (hover: hover) {
          .mapcard-area .mapcard-btn:hover { transform: translateX(-50%) translateY(-1px); }
        }
        @media (max-width: 768px) {
          .mapcard-map-wrap { height: 240px; }
        }
        @media (max-width: 640px) {
          .mapcard-btn { width: 100%; margin: 12px 0 0; padding: 12px 20px; font-size: 14px; }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
        <h3 style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "var(--primary)", margin: 0,
          fontFamily: "var(--font-dm-sans), sans-serif",
        }}>
          Ubicación
        </h3>
      </div>

      <div className="mapcard-area">
      {/* key on the wrapper div forces a full DOM teardown when lat/lng or instance changes */}
      <div
        key={mapKey}
        className="mapcard-map-wrap"
        style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}
      >
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          // La rueda del mouse baja por la página: con true hacía zoom en el
          // mapa al pasar por encima. Quedan los botones + / −.
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

      <a
        href={directionsUrl(lat, lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="mapcard-btn"
      >
        <span>📍</span>
        <span>Cómo llegar</span>
      </a>
      </div>
    </div>
  )
}

export default MapCard
