'use client'

// El mapa del editor: los puntos con su número, como en la nota. Los puntos
// libres se arrastran para ubicarlos mejor; con "Ubicar en el mapa" el
// próximo clic los pone ahí. Se encuadra cuando se suma o se saca algo, no
// al arrastrar.
import { MapContainer, TileLayer, Polyline, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useMemo, useRef } from 'react'
import { pinIcon, TRACK_COLORS } from '../BlogMap'

function Fit({ latLngs, fitKey }) {
  const map = useMap()
  const last = useRef(null)
  useEffect(() => {
    if (last.current === fitKey) return
    last.current = fitKey
    map.invalidateSize()
    if (latLngs.length === 1) map.setView(latLngs[0], 12)
    else if (latLngs.length > 1) map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40], maxZoom: 14 })
  }, [fitKey, latLngs, map])
  return null
}

function Clicks({ placing, onPlace }) {
  const map = useMapEvents({
    click(e) {
      if (placing) onPlace(placing, Math.round(e.latlng.lat * 1e6) / 1e6, Math.round(e.latlng.lng * 1e6) / 1e6)
    },
  })
  useEffect(() => {
    map.getContainer().style.cursor = placing ? 'crosshair' : ''
  }, [map, placing])
  return null
}

function Markers({ points, selectedId, onMove, onSelect }) {
  const map = useMap()
  useEffect(() => {
    const layer = L.layerGroup()
    points.forEach(point => {
      const marker = L.marker([point.lat, point.lng], {
        // Solo el abierto dice su nombre: los demás, el número (están en la lista).
        icon: pinIcon(point, { active: point.id === selectedId, showName: point.id === selectedId }),
        draggable: !point.spot,
        title: point.name,
        zIndexOffset: point.id === selectedId ? 1000 : 0,
      })
      marker.on('click', () => onSelect(point.id))
      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng()
        onMove(point.id, Math.round(lat * 1e6) / 1e6, Math.round(lng * 1e6) / 1e6)
      })
      layer.addLayer(marker)
    })
    layer.addTo(map)
    return () => { layer.remove() }
  }, [map, points, selectedId, onMove, onSelect])
  return null
}

export default function EditorMap({ points, tracks, placing, selectedId, onPlace, onMove, onSelect }) {
  const located = useMemo(() => points.filter(p => p.lat != null && p.lng != null), [points])
  const latLngs = useMemo(() => [
    ...located.map(p => [p.lat, p.lng]),
    ...tracks.flatMap(t => t.points.map(([lat, lng]) => [lat, lng])),
  ], [located, tracks])
  // Cambia al sumar o sacar puntos o recorridos, no al moverlos.
  const fitKey = `${located.map(p => p.id).join(',')}|${tracks.map(t => t.id).join(',')}`

  return (
    <MapContainer center={latLngs[0] ?? [-32.5, -56.0]} zoom={latLngs.length ? 11 : 6} minZoom={2} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {tracks.map((track, i) => (
        <Polyline key={track.id} positions={track.points.map(([lat, lng]) => [lat, lng])} pathOptions={{ color: TRACK_COLORS[i % TRACK_COLORS.length], weight: 4, opacity: 0.9 }} />
      ))}
      <Markers points={located} selectedId={selectedId} onMove={onMove} onSelect={onSelect} />
      <Clicks placing={placing} onPlace={onPlace} />
      <Fit latLngs={latLngs} fitKey={fitKey} />
    </MapContainer>
  )
}
