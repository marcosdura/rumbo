"use client"

// El recorrido sobre el mapa: la línea, el inicio (verde) y el final (rojo),
// encuadrado. Se carga solo en el navegador (Leaflet necesita window).
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type { TrackPoint } from "@/lib/gpx"

export default function TrackMap({ points }: { points: TrackPoint[] }) {
  const line = points.map(([lat, lng]) => [lat, lng] as [number, number])
  const start = line[0]
  const end = line[line.length - 1]
  return (
    <div style={{ height: 340, borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}>
      <MapContainer bounds={line} boundsOptions={{ padding: [24, 24] }} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Polyline positions={line} pathOptions={{ color: "#1b4332", weight: 4 }} />
        <CircleMarker center={start} radius={7} pathOptions={{ color: "#fff", fillColor: "#2d6a4f", fillOpacity: 1, weight: 2 }}>
          <Tooltip>Inicio</Tooltip>
        </CircleMarker>
        <CircleMarker center={end} radius={7} pathOptions={{ color: "#fff", fillColor: "#c0392b", fillOpacity: 1, weight: 2 }}>
          <Tooltip>Final</Tooltip>
        </CircleMarker>
      </MapContainer>
    </div>
  )
}
