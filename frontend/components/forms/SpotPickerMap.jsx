"use client"
// Mapa para elegir un lugar existente tocando su pin (agregar-lugar). El
// elegido se resalta y, si se elige desde el buscador, el mapa va hasta él.
import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

function FitAll({ spots }) {
  const map = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (fitted.current || spots.length === 0) return
    fitted.current = true
    if (spots.length === 1) { map.setView([spots[0].lat, spots[0].lng], 11); return }
    map.fitBounds(L.latLngBounds(spots.map(s => [s.lat, s.lng])), { padding: [24, 24] })
  }, [map, spots])
  return null
}

function FlyToSelected({ spot }) {
  const map = useMap()
  useEffect(() => {
    if (spot) map.flyTo([spot.lat, spot.lng], Math.max(map.getZoom(), 11), { duration: 0.6 })
  }, [map, spot?.id])
  return null
}

export default function SpotPickerMap({ spots, selectedId, onSelect }) {
  const selected = spots.find(s => s.id === selectedId) ?? null
  return (
    <MapContainer center={[-32.5, -55.7]} zoom={6} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <FitAll spots={spots} />
      <FlyToSelected spot={selected} />
      {spots.map(s => {
        const isSelected = s.id === selectedId
        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={isSelected ? 11 : 8}
            pathOptions={{
              color: "#fff", weight: 2, fillOpacity: 1,
              fillColor: isSelected ? "#1b4332" : "#2d6a4f",
            }}
            eventHandlers={{ click: () => onSelect(s.id) }}
          >
            <Tooltip direction="top" offset={[0, -8]} permanent={isSelected}>{s.name}</Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
