"use client"

import FilterDrawerShell from "./FilterDrawerShell"
import {
  TREKKING_FILTERS,
  TrekkingFilterState,
  EMPTY_TREKKING_FILTERS,
  DifficultyValue,
  DurationValue,
  DistanceValue,
  AmenityKey,
} from "../../lib/trekking-filters"

interface Props {
  isOpen:         boolean
  onClose:        () => void
  appliedFilters: TrekkingFilterState
  onApply:        (f: TrekkingFilterState) => void
}

const toggleMulti = <T extends string>(arr: T[], val: T): T[] =>
  arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

export default function FilterDrawer({ isOpen, onClose, appliedFilters, onApply }: Props) {
  return (
    <FilterDrawerShell
      isOpen={isOpen}
      onClose={onClose}
      appliedFilters={appliedFilters}
      onApply={onApply}
      emptyFilters={EMPTY_TREKKING_FILTERS}
    >
      {(pending, setPending) => {
        const toggleAmenity = (k: AmenityKey) => {
          const cur = pending.amenities
          if (cur[k]) {
            const next = { ...cur }
            delete next[k]
            setPending(p => ({ ...p, amenities: next }))
          } else {
            setPending(p => ({ ...p, amenities: { ...p.amenities, [k]: true } }))
          }
        }

        return (
          <>
            {/* Dificultad */}
            <div className="fd-section">
              <p className="fd-section-label">Dificultad</p>
              <div className="fd-pills">
                {TREKKING_FILTERS.difficulty.options.map(opt => (
                  <button
                    key={opt.value}
                    className={`fd-pill${pending.difficulties.includes(opt.value as DifficultyValue) ? " active" : ""}`}
                    onClick={() => setPending(p => ({ ...p, difficulties: toggleMulti(p.difficulties, opt.value as DifficultyValue) }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duración */}
            <div className="fd-section">
              <p className="fd-section-label">Duración</p>
              <div className="fd-pills">
                {TREKKING_FILTERS.duration.options.map(opt => (
                  <button
                    key={opt.value}
                    className={`fd-pill${pending.durations.includes(opt.value as DurationValue) ? " active" : ""}`}
                    onClick={() => setPending(p => ({ ...p, durations: toggleMulti(p.durations, opt.value as DurationValue) }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Distancia */}
            <div className="fd-section">
              <p className="fd-section-label">Distancia</p>
              <div className="fd-pills">
                {TREKKING_FILTERS.distance.options.map(opt => (
                  <button
                    key={opt.value}
                    className={`fd-pill${pending.distances.includes(opt.value as DistanceValue) ? " active" : ""}`}
                    onClick={() => setPending(p => ({ ...p, distances: toggleMulti(p.distances, opt.value as DistanceValue) }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Servicios */}
            <div className="fd-section">
              <p className="fd-section-label">Servicios</p>
              <div className="fd-pills">
                {TREKKING_FILTERS.amenities.map(a => (
                  <button
                    key={a.key}
                    className={`fd-pill${pending.amenities[a.key as AmenityKey] ? " active" : ""}`}
                    onClick={() => toggleAmenity(a.key as AmenityKey)}
                  >
                    {a.emoji} {a.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )
      }}
    </FilterDrawerShell>
  )
}
