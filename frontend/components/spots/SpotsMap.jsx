'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Pill from '@/components/ui/Pill';
import { useEffect, useState, useRef, useMemo } from 'react';

const CATEGORY_EMOJI = {
  'Camping':    '🏕️',
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
}

const createPillIcon = (categoryName, isActive, isSelected) => {
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

  return L.divIcon({
    html: `
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

function FitBounds({ spots }) {
  const map = useMap()
  const fittedRef = useRef(false)
  const spotIds = spots.map(s => s.id).join(',')

  useEffect(() => { fittedRef.current = false }, [spotIds])

  useEffect(() => {
    if (spots.length === 0 || fittedRef.current) return
    fittedRef.current = true
    if (spots.length === 1) { map.setView([spots[0].lat, spots[0].lng], 11); return }
    const bounds = L.latLngBounds(spots.map(s => [s.lat, s.lng]))
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 11 })
  }, [spotIds, map])

  return null
}

function SpotMarker({ spot, isActive, isSelected, onHover, onLeave, onSelect, onDeselect }) {
  const icon = useMemo(
    () => createPillIcon(spot.category?.name, isActive, isSelected),
    [spot.category?.name, isActive, isSelected]
  )

  return (
    <Marker
      position={[spot.lat, spot.lng]}
      icon={icon}
      zIndexOffset={isSelected ? 2000 : isActive ? 1000 : 0}
      eventHandlers={{
        mouseover: onHover,
        mouseout:  onLeave,
        popupopen: onSelect,
        popupclose: onDeselect,
      }}
    >
      <Popup>
        <div
          onClick={() => window.open(`/spots/${spot.id}`, '_blank')}
          style={{
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            minWidth: 180,
            padding: '2px 0',
          }}
        >
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600, fontSize: 15,
            color: '#1b1b19', margin: '0 0 4px',
          }}>
            {spot.name}
          </p>
          <p style={{
            fontSize: 12, color: '#9a9690',
            margin: '0 0 10px',
          }}>
            {spot.department}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {spot.category?.name && (
              <Pill variant="green" style={{ padding: '3px 8px' }}>
                {CATEGORY_EMOJI[spot.category.name]} {spot.category.name}
              </Pill>
            )}
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: '#2d6a4f', marginLeft: 'auto',
            }}>
              Ver →
            </span>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

export default function SpotsMap({ spots, highlightedSpotId, mapExpanded }) {
  const [hoveredSpotId, setHoveredSpotId]   = useState(null)
  const [selectedSpotId, setSelectedSpotId] = useState(null)

  const validSpots = useMemo(
    () => spots.filter(s => s.lat && s.lng),
    [spots]
  )

  const activeSpotId = hoveredSpotId ?? highlightedSpotId

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
        {validSpots.length > 0 && <FitBounds spots={validSpots} />}

        {validSpots.map(spot => (
          <SpotMarker
            key={spot.id}
            spot={spot}
            isActive={activeSpotId === spot.id}
            isSelected={selectedSpotId === spot.id}
            onHover={() => setHoveredSpotId(spot.id)}
            onLeave={() => setHoveredSpotId(prev => prev === spot.id ? null : prev)}
            onSelect={() => setSelectedSpotId(spot.id)}
            onDeselect={() => setSelectedSpotId(null)}
          />
        ))}
      </MapContainer>
    </>
  )
}