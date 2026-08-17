"use client"

import FilterDrawerShell from "./FilterDrawerShell"
import { KAYAK_FILTERS, KayakFilterState, EMPTY_KAYAK_FILTERS } from "../../lib/kayak-filters"

interface Props {
  isOpen:         boolean
  onClose:        () => void
  appliedFilters: KayakFilterState
  onApply:        (f: KayakFilterState) => void
}

const toggleMulti = (arr: string[], val: string): string[] =>
  arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

export default function KayakFilterDrawer({ isOpen, onClose, appliedFilters, onApply }: Props) {
  return (
    <FilterDrawerShell
      isOpen={isOpen}
      onClose={onClose}
      appliedFilters={appliedFilters}
      onApply={onApply}
      emptyFilters={EMPTY_KAYAK_FILTERS}
    >
      {(pending, setPending) => (
        <>
          {/* Tipo de agua */}
          <div className="fd-section">
            <p className="fd-section-label">Tipo de agua</p>
            <div className="fd-pills">
              {KAYAK_FILTERS.waterType.options.map(opt => (
                <button
                  key={opt.value}
                  className={`fd-pill${pending.waterTypes.includes(opt.value) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, waterTypes: toggleMulti(p.waterTypes, opt.value) }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dificultad */}
          <div className="fd-section">
            <p className="fd-section-label">Dificultad</p>
            <div className="fd-pills">
              {KAYAK_FILTERS.difficulty.options.map(opt => (
                <button
                  key={opt.value}
                  className={`fd-pill${pending.difficulties.includes(opt.value) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, difficulties: toggleMulti(p.difficulties, opt.value) }))}
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
              {KAYAK_FILTERS.duration.options.map(opt => (
                <button
                  key={opt.value}
                  className={`fd-pill${pending.durations.includes(opt.value) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, durations: toggleMulti(p.durations, opt.value) }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alquiler */}
          <div className="fd-section">
            <p className="fd-section-label">Servicios</p>
            <button
              className={`fd-toggle${pending.rentalAvailable ? " active" : ""}`}
              onClick={() => setPending(p => ({ ...p, rentalAvailable: !p.rentalAvailable }))}
            >
              🛶 Alquiler de kayaks disponible
            </button>
          </div>
        </>
      )}
    </FilterDrawerShell>
  )
}
