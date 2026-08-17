"use client"

import FilterDrawerShell from "./FilterDrawerShell"
import { SURF_FILTERS, SurfFilterState, EMPTY_SURF_FILTERS } from "../../lib/surf-filters"

interface Props {
  isOpen:         boolean
  onClose:        () => void
  appliedFilters: SurfFilterState
  onApply:        (f: SurfFilterState) => void
}

const toggleMulti = <T extends string>(arr: T[], val: T): T[] =>
  arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

export default function SurfFilterDrawer({ isOpen, onClose, appliedFilters, onApply }: Props) {
  return (
    <FilterDrawerShell
      isOpen={isOpen}
      onClose={onClose}
      appliedFilters={appliedFilters}
      onApply={onApply}
      emptyFilters={EMPTY_SURF_FILTERS}
    >
      {(pending, setPending) => (
        <>
          {/* Tipo de clase */}
          <div className="fd-section">
            <p className="fd-section-label">Tipo de clase</p>
            <div className="fd-pills">
              {SURF_FILTERS.classType.options.map(opt => (
                <button
                  key={opt.value}
                  className={`fd-pill${pending.classTypes.includes(opt.value) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, classTypes: toggleMulti(p.classTypes, opt.value) }))}
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
              {SURF_FILTERS.duration.options.map(opt => (
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

          {/* Servicios */}
          <div className="fd-section">
            <p className="fd-section-label">Servicios</p>
            <div className="fd-toggles">
              <button
                className={`fd-toggle${pending.hasSurfSchool ? " active" : ""}`}
                onClick={() => setPending(p => ({ ...p, hasSurfSchool: !p.hasSurfSchool }))}
              >
                🏄 Tiene escuela de surf
              </button>
              <button
                className={`fd-toggle${pending.equipmentIncluded ? " active" : ""}`}
                onClick={() => setPending(p => ({ ...p, equipmentIncluded: !p.equipmentIncluded }))}
              >
                🎽 Equipamiento incluido
              </button>
            </div>
          </div>
        </>
      )}
    </FilterDrawerShell>
  )
}
