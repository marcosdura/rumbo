'use client'

// El mapa de una nota del blog: los puntos numerados (lugares de Rumbo y
// puntos libres), los recorridos y su inicio y fin. Se carga solo en el
// navegador (Leaflet necesita window). Los pines son los del mapa de la
// búsqueda (SpotsMap.createPillIcon) con el número del punto adelante. El
// del punto que se está leyendo se resalta; el elegido se centra y abre su
// globo.
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Fragment, useEffect, useMemo, useRef } from 'react'
import { pointAnchor } from '@/lib/blog'
import { createPillIcon } from '@/components/spots/SpotsMap'

export const TRACK_COLORS = ['#1b4332', '#b5651d', '#3a6ea5', '#8e3b46']

const escapeHtml = (str) =>
  String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))

// El pin de un punto: el de la búsqueda. Un lugar de Rumbo lleva el emoji de
// su actividad; un punto libre, el de su tipo (refugio, mirador…).
export function pointIcon(point, { active = false, selected = false } = {}) {
  return createPillIcon(
    point.spot ? point.kind : null, [], active, selected, point.name,
    { emoji: point.spot ? null : point.emoji, number: point.number },
  )
}

// Lo que dice el globo. Todo escapado: los nombres y notas los escribe alguien.
export function popupHtml(point, { hasSection }) {
  const where = point.spot?.department ? ` · ${escapeHtml(point.spot.department)}` : ''
  const links = [
    hasSection ? `<a class="blog-popup-link" href="#${pointAnchor(point.id)}">Leer en la nota ↓</a>` : '',
    point.href ? `<a class="blog-popup-link is-primary" href="${escapeHtml(point.href)}">Ver en Rumbo →</a>` : '',
    point.url ? `<a class="blog-popup-link" href="${escapeHtml(point.url)}" target="_blank" rel="noopener noreferrer">Más info ↗</a>` : '',
  ].filter(Boolean).join('')
  return `<div class="blog-popup">
    <p class="blog-popup-kind">${point.emoji} ${escapeHtml(point.kind)}${where}</p>
    <p class="blog-popup-name"><span class="blog-popup-num">${point.number}</span>${escapeHtml(point.name)}</p>
    ${point.note ? `<p class="blog-popup-note">${escapeHtml(point.note)}</p>` : ''}
    ${links ? `<div class="blog-popup-links">${links}</div>` : ''}
  </div>`
}

function allLatLngs(points, tracks) {
  return [
    ...points.map(p => [p.lat, p.lng]),
    ...tracks.flatMap(t => t.points.map(([lat, lng]) => [lat, lng])),
  ]
}

// Encuadra todo cada vez que el mapa cambia de tamaño: al aparecer (llega
// sin tamaño mientras se arma la página) o al girar el celular.
function Fit({ latLngs }) {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    let timer = null
    let lastSize = ''
    const fit = () => {
      const size = `${el.clientWidth}x${el.clientHeight}`
      if (!el.clientWidth || !el.clientHeight || size === lastSize) return
      lastSize = size
      map.invalidateSize()
      if (latLngs.length === 1) map.setView(latLngs[0], 13)
      else if (latLngs.length > 1) {
        // Más margen a los costados: el pin lleva el nombre a los dos lados
        // del punto (si no, los de las puntas quedan cortados).
        map.fitBounds(L.latLngBounds(latLngs), { padding: [90, 50], maxZoom: 14 })
      }
    }
    const observer = new ResizeObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(fit, 60)
    })
    observer.observe(el)
    fit()
    return () => { observer.disconnect(); clearTimeout(timer) }
  }, [latLngs, map])
  return null
}

function Markers({ points, activeId, selected, sectionIds, onPick }) {
  const map = useMap()
  const markersRef = useRef({})

  useEffect(() => {
    const layer = L.layerGroup()
    const byId = {}
    points.forEach(point => {
      const marker = L.marker([point.lat, point.lng], { icon: pointIcon(point), keyboard: true, title: point.name })
      marker.bindPopup(popupHtml(point, { hasSection: sectionIds.has(point.id) }))
      marker.on('click', () => onPick?.(point.id))
      layer.addLayer(marker)
      byId[point.id] = marker
    })
    layer.addTo(map)
    markersRef.current = byId
    return () => { layer.remove(); markersRef.current = {} }
  }, [map, points, sectionIds, onPick])

  useEffect(() => {
    points.forEach(point => {
      const marker = markersRef.current[point.id]
      if (!marker) return
      const selectedNow = point.id === selected?.id
      const active = point.id === activeId
      marker.setIcon(pointIcon(point, { active, selected: selectedNow }))
      marker.setZIndexOffset(active || selectedNow ? 1000 : 0)
    })
  }, [points, activeId, selected])

  // Elegido desde el texto: se centra y abre su globo. `selected.at` cambia
  // en cada toque, así el mismo punto se puede volver a elegir.
  useEffect(() => {
    if (!selected) return
    const marker = markersRef.current[selected.id]
    if (!marker) return
    const id = setTimeout(() => {
      map.invalidateSize()
      map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 13), { duration: 0.6 })
      marker.openPopup()
    }, 120)
    return () => clearTimeout(id)
  }, [selected, map])

  return null
}

export default function BlogMap({ points, tracks, activeId, selected, sectionIds, onPick }) {
  const located = useMemo(() => points.filter(p => p.lat != null && p.lng != null), [points])
  const latLngs = useMemo(() => allLatLngs(located, tracks), [located, tracks])
  const center = latLngs[0] ?? [-32.5, -56.0]

  return (
    // Como el mapa del lugar (MapCard): la rueda del mouse baja por la
    // página; para acercarse, los botones + / −.
    <MapContainer center={center} zoom={11} minZoom={2} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {tracks.map((track, i) => {
        const line = track.points.map(([lat, lng]) => [lat, lng])
        const color = TRACK_COLORS[i % TRACK_COLORS.length]
        return (
          <Fragment key={track.id}>
            <Polyline positions={line} pathOptions={{ color, weight: 4, opacity: 0.9 }} />
            <CircleMarker center={line[0]} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: '#2d6a4f', fillOpacity: 1 }} />
            <CircleMarker center={line[line.length - 1]} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: '#b91c1c', fillOpacity: 1 }} />
          </Fragment>
        )
      })}
      <Markers points={located} activeId={activeId} selected={selected} sectionIds={sectionIds} onPick={onPick} />
      <Fit latLngs={latLngs} />
    </MapContainer>
  )
}
