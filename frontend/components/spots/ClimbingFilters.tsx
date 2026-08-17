"use client"

import FilterDrawerShell from "./FilterDrawerShell"
import { CLIMBING_FILTERS, ClimbingFilterState, EMPTY_CLIMBING_FILTERS } from "../../lib/climbing-filters"

interface Props {
  isOpen:         boolean
  onClose:        () => void
  appliedFilters: ClimbingFilterState
  onApply:        (f: ClimbingFilterState) => void
}

const toggleMulti = <T extends string>(arr: T[], val: T): T[] =>
  arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

export default function ClimbingFilterDrawer({ isOpen, onClose, appliedFilters, onApply }: Props) {
  return (
    <FilterDrawerShell
      isOpen={isOpen}
      onClose={onClose}
      appliedFilters={appliedFilters}
      onApply={onApply}
      emptyFilters={EMPTY_CLIMBING_FILTERS}
    >
      {(pending, setPending) => (
        <>
          {/* Tipo de escalada */}
          <div className="fd-section">
            <p className="fd-section-label">Tipo de escalada</p>
            <div className="fd-pills">
              {CLIMBING_FILTERS.type.options.map(opt => (
                <button
                  key={opt.value}
                  className={`fd-pill${pending.types.includes(opt.value) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, types: toggleMulti(p.types, opt.value) }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nivel de grados */}
          <div className="fd-section">
            <p className="fd-section-label">Nivel de grados</p>
            <div className="fd-pills">
              {CLIMBING_FILTERS.gradeRange.options.map(opt => (
                <button
                  key={opt.value}
                  className={`fd-pill${pending.gradeRanges.includes(opt.value) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, gradeRanges: toggleMulti(p.gradeRanges, opt.value) }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Acceso */}
          <div className="fd-section">
            <p className="fd-section-label">Acceso</p>
            <button
              className={`fd-toggle${pending.hasRestrictions ? " active" : ""}`}
              onClick={() => setPending(p => ({ ...p, hasRestrictions: !p.hasRestrictions }))}
            >
              ⚠️ Sin restricciones
            </button>
          </div>
        </>
      )}
    </FilterDrawerShell>
  )
}
