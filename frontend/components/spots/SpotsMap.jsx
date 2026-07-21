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

const createPillIcon = (categoryName, extraCategories, isActive, isSelected) => {
  const emoji = CATEGORY_EMOJI[categoryName] || '📍'
  const label = categoryName || 'Spot'

  const bg      = isSelected ? '#1b4332'
                : isActive   ? '#2d6a4f'
                : '#fff'
  const border  = isSelected ? '#2d6a4f'
                : isActive   ? '#2d6a4f'
                : '#e0ddd6'
  const color   = isSelected || isActive ? '#d8f3dc' : '#3d3d3a'
  const shadow  = isSelected
                  ? '0 4px 18px rgba(27,67,50,0.35), 0 0 0 3px rgba(45,106,79,0.2)'
                  : isActive
                  ? '0 4px 14px rgba(27,67,50,0.25)'
                  : '0 2px 8px rgba(0,0,0,0.1)'
  const scale   = isActive || isSelected ? 'scale(1.08)' : 'scale(1)'
  const weight  = isSelected ? '600' : '500'

  const visibleExtras = (extraCategories || []).slice(0, 2)
  const badgesHtml = visibleExtras.map((catName, i) => `
    <div style="
      position: absolute;
      top: -6px;
      right: ${-6 + i * 16}px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      border: 1.5px solid #e0ddd6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      z-index: ${10 - i};
    ">${CATEGORY_EMOJI[catName] || '📍'}</div>
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
      background:#e8f5ee; color:#1b4332; border:1px solid #b7dfc8;
      font-size:10px; font-weight:600; letter-spacing:0.03em;
      font-family:'DM Sans', sans-serif;
    ">${CATEGORY_EMOJI[cat.name] ?? ''} ${cat.name}</span>
  `).join('')

  return `
    <a href="/spots/${spot.slug}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
      <div style="cursor:pointer; font-family:'DM Sans', sans-serif; min-width:180px; padding:2px 0;">
        <p style="font-family:'Playfair Display', serif; font-weight:600; font-size:15px; color:#1b1b19; margin:0 0 4px;">
          ${spot.name}
        </p>
        <p style="font-size:12px; color:#9a9690; margin:0 0 10px;">
          ${spot.department ?? ''}
        </p>
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; gap:6px; flex-wrap:wrap;">${pillsHtml}</div>
          <span style="font-size:12px; font-weight:600; color:#2d6a4f; margin-left:auto;">Ver →</span>
        </div>
      </div>
    </a>
  `
}

function spotCategories(spot) {
  return spot.categories && spot.categories.length > 0 ? spot.categories : (spot.category ? [spot.category] : [])
}

function ClusteredMarkers({ spots, activeSpotId, selectedSpotId, onHover, onLeave, onSelect, onDeselect }) {
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
      const primaryCategoryName = categories[0]?.name ?? spot.category?.name
      const extraCategoryNames = categories.slice(1).map(c => c.name)

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
  }, [map, spots, onHover, onLeave, onSelect, onDeselect])

  // Actualiza el ícono de cada marker in-place al hacer hover/seleccionar, sin reconstruir el grupo
  useEffect(() => {
    spots.forEach(spot => {
      const marker = markersRef.current[spot.id]
      if (!marker) return
      const categories = spotCategories(spot)
      const primaryCategoryName = categories[0]?.name ?? spot.category?.name
      const extraCategoryNames = categories.slice(1).map(c => c.name)
      const isActive = activeSpotId === spot.id
      const isSelected = selectedSpotId === spot.id
      marker.setIcon(createPillIcon(primaryCategoryName, extraCategoryNames, isActive, isSelected))
      marker.setZIndexOffset(isSelected ? 2000 : isActive ? 1000 : 0)
    })
  }, [spots, activeSpotId, selectedSpotId])

  return null
}

export default function SpotsMap({ spots, highlightedSpotId, mapExpanded }) {
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
          border: 1px solid #e0ddd6 !important;
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
          color: #9a9690 !important;
          font-size: 16px !important;
          padding: 6px 8px !important;
        }
        .leaflet-popup-close-button:hover {
          color: #1b1b19 !important;
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
          onHover={handleHover}
          onLeave={handleLeave}
          onSelect={handleSelect}
          onDeselect={handleDeselect}
        />
      </MapContainer>
    </>
  )
}