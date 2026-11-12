'use client'

// El mapa de una nota del blog: los puntos numerados (lugares de Rumbo y
// puntos libres), los recorridos y su inicio y fin. Se carga solo en el
// navegador (Leaflet necesita window). El pin del punto que se está leyendo
// se resalta; el elegido se centra y abre su globo.
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { pointAnchor } from '@/lib/blog'

export const TRACK_COLORS = ['#1b4332', '#b5651d', '#3a6ea5', '#8e3b46']

const escapeHtml = (str) =>
  String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))

const NAME_MAX = 22
// Desde este zoom los pines dicen el nombre.
const NAMES_FROM_ZOOM = 13
const shortName = (name) => name.length > NAME_MAX ? `${name.slice(0, NAME_MAX - 1).trimEnd()}…` : name

export function pinIcon(point, { active = false, showName = true } = {}) {
  const cls = ['blog-pin', point.spot ? 'is-rumbo' : 'is-free', active ? 'is-active' : ''].filter(Boolean).join(' ')
  return L.divIcon({
    html: `<div class="blog-pin-wrap"><div class="${cls}">
      <span class="blog-pin-num">${point.number}</span>
      <span class="blog-pin-emoji" aria-hidden="true">${point.emoji}</span>
      ${showName ? `<span class="blog-pin-name">${escapeHtml(shortName(point.name))}</span>` : ''}
    </div></div>`,
    className: '',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -16],
  })
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
// sin tamaño mientras se arma la página), al abrirlo a pantalla completa en
// el celular y al cerrarlo. Los pines llevan el nombre a la derecha: se deja
// más margen de ese lado para que no queden cortados.
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
        map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50], maxZoom: 14 })
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
      const marker = L.marker([point.lat, point.lng], { icon: pinIcon(point, { showName: false }), keyboard: true, title: point.name })
      marker.bindPopup(popupHtml(point, { hasSection: sectionIds.has(point.id) }))
      marker.on('click', () => onPick?.(point.id))
      layer.addLayer(marker)
      byId[point.id] = marker
    })
    layer.addTo(map)
    markersRef.current = byId
    return () => { layer.remove(); markersRef.current = {} }
  }, [map, points, sectionIds, onPick])

  // Con el mapa lejos, los pines de lugares cercanos se pisan: solo número y
  // emoji (los nombres están en la lista). El nombre aparece al acercarse o
  // en el punto que se está leyendo.
  const [zoom, setZoom] = useState(() => map.getZoom())
  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom())
    map.on('zoomend', onZoom)
    return () => { map.off('zoomend', onZoom) }
  }, [map])

  useEffect(() => {
    points.forEach(point => {
      const marker = markersRef.current[point.id]
      if (!marker) return
      const active = point.id === activeId || point.id === selected?.id
      marker.setIcon(pinIcon(point, { active, showName: active || zoom >= NAMES_FROM_ZOOM }))
      marker.setZIndexOffset(active ? 1000 : 0)
    })
  }, [points, activeId, selected, zoom])

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
    <MapContainer center={center} zoom={11} minZoom={2} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
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
