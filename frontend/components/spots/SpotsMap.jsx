'use client';

import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';

const CATEGORY_EMOJI = {
  'Camping':    '🏕️',
  'Glamping':   '🛖',
  'Escalada':   '🧗',
  'Senderismo': '🥾',
  'MTB':        '🚵',
  'Surf':       '🏄',
  'Natación':   '🏊',
  'Pesca':      '🎣',
  'Kayak':      '🛶',
  'Ciclismo':   '🚴',
  'Fotografía': '📷',
  'Trekking':   '🥾',
  'Motorhome':  '🚐',
}

const escapeHtml = (str) =>
  String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))

const buildExtraBadges = (extraCategories) => {
  const names = extraCategories || []
  if (names.length <= 3) {
    return names.map(name => ({ text: CATEGORY_EMOJI[name] || '📍', isCount: false }))
  }
  const remaining = names.length - 2
  return [
    { text: CATEGORY_EMOJI[names[0]] || '📍', isCount: false },
    { text: CATEGORY_EMOJI[names[1]] || '📍', isCount: false },
    { text: `+${remaining}`, isCount: true },
  ]
}

const createPillIcon = (categoryName, extraCategories, isActive, isSelected) => {
  const emoji = CATEGORY_EMOJI[categoryName] || '📍'
  const label = categoryName || 'Spot'

  const bg      = isSelected ? 'var(--primary-dark)'
                : isActive   ? 'var(--primary)'
                : '#fff'
  const border  = isSelected ? 'var(--primary)'
                : isActive   ? 'var(--primary)'
                : 'var(--border)'
  const color   = isSelected || isActive ? '#d8f3dc' : '#3d3d3a'
  const shadow  = isSelected
                  ? '0 4px 18px rgba(27,67,50,0.35), 0 0 0 3px rgba(45,106,79,0.2)'
                  : isActive
                  ? '0 4px 14px rgba(27,67,50,0.25)'
                  : '0 2px 8px rgba(0,0,0,0.1)'
  const scale   = isActive || isSelected ? 'scale(1.08)' : 'scale(1)'
  const weight  = isSelected ? '600' : '500'

  const badges = buildExtraBadges(extraCategories)
  const badgesHtml = badges.map((badge, i) => `
    <div style="
      position: absolute;
      top: -6px;
      right: ${-6 + i * 16}px;
      min-width: 18px;
      height: 18px;
      border-radius: 999px;
      background: ${badge.isCount ? 'var(--primary-dark)' : '#fff'};
      border: 1.5px solid ${badge.isCount ? 'var(--primary-dark)' : 'var(--border)'};
      display: flex;
      align-items: center;
      justify-content: center;
      padding: ${badge.isCount ? '0 4px' : '0'};
      font-size: ${badge.isCount ? '9px' : '10px'};
      font-weight: ${badge.isCount ? '700' : '400'};
      color: ${badge.isCount ? '#d8f3dc' : '#3d3d3a'};
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      z-index: ${10 - i};
    ">${badge.text}</div>
  `).join('')

  return L.divIcon({
    html: `
      <div style="position: relative; display: inline-block;">
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: ${bg};
          border: 1.5px solid ${border};
          border-radius: 999px;
          padding: 5px 11px;
          font-size: 12px;
          font-weight: ${weight};
          color: ${color};
          white-space: nowrap;
          box-shadow: ${shadow};
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transform: ${scale};
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        ">
          <span style="font-size:14px;line-height:1">${emoji}</span>
          ${label}
        </div>
        ${badgesHtml}
      </div>
    `,
    className: '',
    iconSize: null,
    iconAnchor: [0, 20],
    popupAnchor: [60, -10],
  })
}

function ResizeHandler({ trigger }) {
  const map = useMap()
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 50)
    return () => clearTimeout(id)
  }, [trigger, map])
  return null
}

function FitBounds({ spots, mapExpanded }) {
  const map = useMap()
  const fittedRef = useRef(false)
  const spotIds = spots.map(s => s.id).join(',')

  useEffect(() => { fittedRef.current = false }, [spotIds])

  // Desktop: fit on initial load and when spots change
  useEffect(() => {
    if (spots.length === 0 || fittedRef.current) return
    fittedRef.current = true
    if (spots.length === 1) { map.setView([spots[0].lat, spots[0].lng], 11); return }
    const bounds = L.latLngBounds(spots.map(s => [s.lat, s.lng]))
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 11 })
  }, [spotIds, map])

  // Mobile fullscreen: re-fit after CSS transition and invalidateSize complete
  useEffect(() => {
    if (!mapExpanded || spots.length === 0) return
    const id = setTimeout(() => {
      map.invalidateSize()
      if (spots.length === 1) {
        map.setView([spots[0].lat, spots[0].lng], 13)
        return
      }
      const bounds = L.latLngBounds(spots.map(s => [s.lat, s.lng]))
      map.fitBounds(bounds, { padding: [60, 60] })
    }, 100)
    return () => clearTimeout(id)
  }, [mapExpanded, spotIds, map])

  return null
}

const createPopupHtml = (spot, categories) => {
  const pillsHtml = categories.map(cat => `
    <span style="
      display:inline-flex; align-items:center; gap:4px;
      padding:3px 8px; border-radius:999px;
      background:#e8f5ee; color:var(--primary-dark); border:1px solid #b7dfc8;
      font-size:10px; font-weight:600; letter-spacing:0.03em;
      font-family:'DM Sans', sans-serif;
    ">${CATEGORY_EMOJI[cat.name] ?? ''} ${cat.name}</span>
  `).join('')

  return `
    <a href="/spots/${spot.slug}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
      <div style="cursor:pointer; font-family:'DM Sans', sans-serif; min-width:180px; padding:2px 0;">
        <p style="font-family:'Playfair Display', serif; font-weight:600; font-size:15px; color:#1b1b19; margin:0 0 4px;">
          ${escapeHtml(spot.name)}
        </p>
        <p style="font-size:12px; color:var(--muted); margin:0 0 10px;">
          ${escapeHtml(spot.department)}
        </p>
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; gap:6px; flex-wrap:wrap;">${pillsHtml}</div>
          <span style="font-size:12px; font-weight:600; color:var(--primary); margin-left:auto;">Ver →</span>
        </div>
      </div>
    </a>
  `
}

function spotCategories(spot) {
  return spot.categories && spot.categories.length > 0 ? spot.categories : (spot.category ? [spot.category] : [])
}

// Si hay una categoría buscada activa y el spot la tiene (aunque no sea la principal),
// se muestra esa en la pill en vez de la categoría principal del spot.
function pillCategoryName(categories, activeCategory) {
  if (activeCategory && categories.some(c => c.name === activeCategory)) return activeCategory
  return categories[0]?.name
}

function pillExtraCategoryNames(categories, mainCategoryName) {
  return categories.map(c => c.name).filter(name => name !== mainCategoryName)
}

function ClusteredMarkers({ spots, activeSpotId, selectedSpotId, activeCategory, onHover, onLeave, onSelect, onDeselect }) {
  const map = useMap()
  const markersRef = useRef({})

  // Crea el grupo de clusters y sus markers cuando cambia la lista de spots
  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    })

    const markersById = {}

    spots.forEach(spot => {
      const categories = spotCategories(spot)
      const primaryCategoryName = pillCategoryName(categories, activeCategory)
      const extraCategoryNames = pillExtraCategoryNames(categories, primaryCategoryName)

      const marker = L.marker([spot.lat, spot.lng], {
        icon: createPillIcon(primaryCategoryName, extraCategoryNames, false, false),
      })

      marker.on('mouseover', () => onHover(spot.id))
      marker.on('mouseout', () => onLeave(spot.id))
      marker.on('popupopen', () => onSelect(spot.id))
      marker.on('popupclose', () => onDeselect())
      marker.bindPopup(createPopupHtml(spot, categories))

      clusterGroup.addLayer(marker)
      markersById[spot.id] = marker
    })

    map.addLayer(clusterGroup)
    markersRef.current = markersById

    return () => {
      map.removeLayer(clusterGroup)
      markersRef.current = {}
    }
  }, [map, spots, activeCategory, onHover, onLeave, onSelect, onDeselect])

  // Actualiza el ícono de cada marker in-place al hacer hover/seleccionar, sin reconstruir el grupo
  useEffect(() => {
    spots.forEach(spot => {
      const marker = markersRef.current[spot.id]
      if (!marker) return
      const categories = spotCategories(spot)
      const primaryCategoryName = pillCategoryName(categories, activeCategory)
      const extraCategoryNames = pillExtraCategoryNames(categories, primaryCategoryName)
      const isActive = activeSpotId === spot.id
      const isSelected = selectedSpotId === spot.id
      marker.setIcon(createPillIcon(primaryCategoryName, extraCategoryNames, isActive, isSelected))
      marker.setZIndexOffset(isSelected ? 2000 : isActive ? 1000 : 0)
    })
  }, [spots, activeSpotId, selectedSpotId, activeCategory])

  return null
}

export default function SpotsMap({ spots, highlightedSpotId, mapExpanded, activeCategory }) {
  const [hoveredSpotId, setHoveredSpotId]   = useState(null)
  const [selectedSpotId, setSelectedSpotId] = useState(null)

  const validSpots = useMemo(
    () => spots.filter(s => s.lat && s.lng),
    [spots]
  )

  const activeSpotId = hoveredSpotId ?? highlightedSpotId

  const handleHover    = useCallback((id) => setHoveredSpotId(id), [])
  const handleLeave    = useCallback((id) => setHoveredSpotId(prev => prev === id ? null : prev), [])
  const handleSelect   = useCallback((id) => setSelectedSpotId(id), [])
  const handleDeselect = useCallback(() => setSelectedSpotId(null), [])

  return (
    <>
      <style>{`
        .leaflet-popup-content-wrapper {
          background: #fff !important;
          border: 1px solid var(--border) !important;
          border-radius: 16px !important;
          box-shadow: 0 8px 28px rgba(0,0,0,0.09) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 14px 16px !important;
        }
        .leaflet-popup-tip {
          background: #fff !important;
          box-shadow: none !important;
        }
        .leaflet-popup-close-button {
          color: var(--muted) !important;
          font-size: 16px !important;
          padding: 6px 8px !important;
        }
        .leaflet-popup-close-button:hover {
          color: #1b1b19 !important;
        }

        /* Cluster base - mismo diseño que las pills del mapa */
        .marker-cluster {
          background: rgba(255, 255, 255, 0.2) !important;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1) !important;
        }
        .marker-cluster div {
          background: #fff !important;
          color: #3d3d3a !important;
          border: 1.5px solid var(--border) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1) !important;
        }
        .marker-cluster:hover {
          background: rgba(45, 106, 79, 0.12) !important;
          z-index: 10000 !important;
        }
        .marker-cluster div:hover {
          background: var(--primary) !important;
          border-color: var(--primary) !important;
          color: #d8f3dc !important;
          box-shadow: 0 4px 14px rgba(27,67,50,0.25) !important;
        }
        .marker-cluster-small div,
        .marker-cluster-medium div,
        .marker-cluster-large div {
          background: #fff !important;
          color: #3d3d3a !important;
          border: 1.5px solid var(--border) !important;
        }
        .leaflet-zoom-animated {
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1) !important;
        }
      `}</style>

      <MapContainer
        center={[-32.5, -56.0]}
        zoom={6}
        minZoom={2}
        maxBoundsViscosity={1.0}
        maxBounds={[[-100, -200], [100, 180]]}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OpenStreetMap contributors'
        />

        <ResizeHandler trigger={mapExpanded} />
        {validSpots.length > 0 && <FitBounds spots={validSpots} mapExpanded={mapExpanded} />}

        <ClusteredMarkers
          spots={validSpots}
          activeSpotId={activeSpotId}
          selectedSpotId={selectedSpotId}
          activeCategory={activeCategory}
          onHover={handleHover}
          onLeave={handleLeave}
          onSelect={handleSelect}
          onDeselect={handleDeselect}
        />
      </MapContainer>
    </>
  )
}