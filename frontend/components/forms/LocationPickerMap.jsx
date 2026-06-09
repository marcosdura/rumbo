"use client"
import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function ClickHandler({ onSelect }) {
  useMapEvents({ click(e) { onSelect(e.latlng.lat, e.latlng.lng) } })
  return null
}

function FlyTo({ lat, lng, trigger }) {
  const map = useMap()
  useEffect(() => {
    if (trigger > 0 && lat != null && lng != null) {
      map.flyTo([lat, lng], 13, { animate: true, duration: 0.8 })
    }
  }, [trigger])
  return null
}

export default function LocationPickerMap({ lat, lng, onSelect, flyTrigger }) {
  const hasCoords = lat != null && lng != null

  return (
    <MapContainer
      center={hasCoords ? [lat, lng] : [-32.5, -55.7]}
      zoom={hasCoords ? 10 : 6}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <ClickHandler onSelect={onSelect} />
      <FlyTo lat={lat} lng={lng} trigger={flyTrigger} />
      {hasCoords && (
        <Marker
          position={[lat, lng]}
          icon={icon}
          draggable
          eventHandlers={{
            dragend(e) {
              const pos = e.target.getLatLng()
              onSelect(pos.lat, pos.lng)
            },
          }}
        />
      )}
    </MapContainer>
  )
}
