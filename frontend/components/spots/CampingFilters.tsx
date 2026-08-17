"use client"

import FilterDrawerShell from "./FilterDrawerShell"
import {
  CAMPING_AMENITY_GROUPS,
  CAMPING_PRICE_RANGES,
  CampingFilterState,
  EMPTY_CAMPING_FILTERS,
} from "../../lib/camping-filters"

const AMENITY_ICONS: Record<string, string> = {
  "Ducha":"🚿","Agua caliente":"🔥","Baños":"🚽","Agua potable":"🚰",
  "Electricidad":"⚡","Lavadero":"🧼","Parrillero":"🔥","Cocina compartida":"🍳",
  "Comedor":"🍽️","Heladera":"🧊","Leña disponible":"🪵","Sombra":"🌳",
  "Mesas y bancos":"🪑","Parcelas delimitadas":"⛺","Acceso a río/lago/mar":"🌊",
  "Playa":"🏖️","Cancha de fútbol":"⚽","Cancha de Voley":"🏐","Piscina":"🏊",
  "Alquiler de bicis":"🚴","Kayak":"🛶","WiFi":"🛜","Acepta mascotas":"🐶",
  "Proveeduría/kiosco":"🛒","Cafetería":"☕","Restaurante/bar":"🍺",
  "Estacionamiento":"🚗","Seguridad":"🔒","Zona para fogón":"🏕️",
  "Tomas para camper/van":"🔌","Área para motorhomes":"🚐",
}

interface Props {
  isOpen:         boolean
  onClose:        () => void
  appliedFilters: CampingFilterState
  onApply:        (f: CampingFilterState) => void
}

export default function CampingFilterDrawer({ isOpen, onClose, appliedFilters, onApply }: Props) {
  return (
    <FilterDrawerShell
      isOpen={isOpen}
      onClose={onClose}
      appliedFilters={appliedFilters}
      onApply={onApply}
      emptyFilters={EMPTY_CAMPING_FILTERS}
      width={520}
    >
      {(pending, setPending) => {
        const toggleAmenity = (id: number) =>
          setPending(p => ({
            ...p,
            amenityIds: p.amenityIds.includes(id)
              ? p.amenityIds.filter(a => a !== id)
              : [...p.amenityIds, id],
          }))

        const togglePrice = (val: CampingFilterState["priceRanges"][number]) =>
          setPending(p => ({
            ...p,
            priceRanges: p.priceRanges.includes(val)
              ? p.priceRanges.filter(v => v !== val)
              : [...p.priceRanges, val],
          }))

        return (
          <>
            {/* Precio */}
            <div className="fd-section">
              <p className="fd-section-label">Precio</p>
              <div className="fd-pills">
                {CAMPING_PRICE_RANGES.map(opt => (
                  <button
                    key={opt.value}
                    className={`fd-pill${pending.priceRanges.includes(opt.value) ? " active" : ""}`}
                    onClick={() => togglePrice(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amenidades agrupadas */}
            {CAMPING_AMENITY_GROUPS.map((group) => (
              <div key={group.label} className="fd-section">
                <p className="fd-section-label">{group.label}</p>
                <div className="fd-pills">
                  {group.amenities.map(amenity => (
                    <button
                      key={amenity.id}
                      className={`fd-pill${pending.amenityIds.includes(amenity.id) ? " active" : ""}`}
                      onClick={() => toggleAmenity(amenity.id)}
                    >
                      {AMENITY_ICONS[amenity.label] || "✨"} {amenity.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )
      }}
    </FilterDrawerShell>
  )
}
