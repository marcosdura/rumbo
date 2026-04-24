'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef, useMemo } from 'react';

const CATEGORY_EMOJI = {
  'Camping': '🏕️',
  'Escalada': '🧗',
  'Senderismo': '🥾',
  'MTB': '🚵',
  'Surf': '🏄',
  'Natación': '🏊',
  'Pesca': '🎣',
  'Kayak': '🛶',
  'Ciclismo': '🚴',
  'Fotografía': '📷',
};

const createPillIcon = (categoryName, isActive, isSelected) => {
  const emoji = CATEGORY_EMOJI[categoryName] || '📍';
  const label = categoryName || 'Spot';

  return L.divIcon({
    html: `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: ${isActive || isSelected
          ? 'linear-gradient(135deg, #6ee7b7, #34d399)'
          : 'linear-gradient(135deg, #d6cebf, #b4aa96)'};
        border: 1.5px solid ${isSelected ? '#059669' : isActive ? '#10b981' : '#b4aa96'};
        border-radius: 999px;
        padding: 5px 11px;
        font-size: 13px;
        font-weight: ${isSelected ? '600' : '500'};
        color: ${isActive || isSelected ? '#065f46' : '#4a443b'};
        white-space: nowrap;
        box-shadow: ${isSelected
          ? '0 4px 18px rgba(16,185,129,0.45), 0 0 0 3px rgba(16,185,129,0.15)'
          : isActive
            ? '0 4px 14px rgba(16,185,129,0.35)'
            : '0 2px 6px rgba(0,0,0,0.12)'};
        font-family: 'DM Sans', sans-serif;
        cursor: pointer;
        transform: ${isActive || isSelected ? 'scale(1.08)' : 'scale(1)'};
      ">
        <span style="font-size:15px;line-height:1">${emoji}</span>
        ${label}
      </div>
    `,
    className: '',
    iconSize: null,
    iconAnchor: [0, 20],
    popupAnchor: [60, -10],
  });
};

function FitBounds({ spots }) {
  const map = useMap();
  const fittedRef = useRef(false);
  const spotIds = spots.map(s => s.id).join(',');

  useEffect(() => { fittedRef.current = false; }, [spotIds]);

  useEffect(() => {
    if (spots.length === 0 || fittedRef.current) return;
    fittedRef.current = true;
    if (spots.length === 1) { map.setView([spots[0].lat, spots[0].lng], 11); return; }
    const bounds = L.latLngBounds(spots.map(s => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 11 });
  }, [spotIds, map]);

  return null;
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
        mouseout: onLeave,
        popupopen: onSelect,
        popupclose: onDeselect,
      }}
    >
      <Popup>
        <div
          onClick={() => window.open(`/spots/${spot.id}`, '_blank')}
          style={{ cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', minWidth: '160px' }}
        >
          <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 4px' }}>{spot.name}</p>
          <p style={{ fontSize: '12px', color: '#9ca3a0', margin: '0 0 8px' }}>{spot.department}</p>
          <p style={{ fontSize: '11px', color: '#059669', margin: 0, fontWeight: 500 }}>Ver spot →</p>
        </div>
      </Popup>
    </Marker>
  )
}

export default function SpotsMap({ spots, highlightedSpotId }) {
  const [hoveredSpotId, setHoveredSpotId] = useState(null);
  const [selectedSpotId, setSelectedSpotId] = useState(null);

  const validSpots = useMemo(
    () => spots.filter(s => s.lat && s.lng),
    [spots]
  );

  const activeSpotId = hoveredSpotId ?? highlightedSpotId;

  return (
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
  );
}