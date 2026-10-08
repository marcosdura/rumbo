"use client"

// Paneles de filtro de Glamping y Motorhome, con el mismo armazón que los
// demás (FilterDrawerShell).
import FilterDrawerShell from "./FilterDrawerShell"
import {
  EMPTY_GLAMPING_FILTERS, EMPTY_MOTORHOME_FILTERS, GLAMPING_AMENITIES, GLAMPING_PRICE_RANGES, MOTORHOME_SERVICES,
  type GlampingFilterState, type MotorhomeFilterState,
} from "../../lib/stay-filters"

const toggleMulti = (arr: string[], val: string): string[] =>
  arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

interface Props<T> {
  isOpen: boolean
  onClose: () => void
  appliedFilters: T
  onApply: (f: T) => void
}

export function GlampingFilterDrawer({ isOpen, onClose, appliedFilters, onApply }: Props<GlampingFilterState>) {
  return (
    <FilterDrawerShell isOpen={isOpen} onClose={onClose} appliedFilters={appliedFilters} onApply={onApply} emptyFilters={EMPTY_GLAMPING_FILTERS}>
      {(pending, setPending) => (
        <>
          <div className="fd-section">
            <p className="fd-section-label">Precio por noche</p>
            <div className="fd-pills">
              {GLAMPING_PRICE_RANGES.map(opt => (
                <button
                  key={opt.value}
                  className={`fd-pill${pending.priceRanges.includes(opt.value) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, priceRanges: toggleMulti(p.priceRanges, opt.value) }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="fd-section">
            <p className="fd-section-label">Servicios</p>
            <div className="fd-pills">
              {GLAMPING_AMENITIES.map(opt => (
                <button
                  key={opt.value}
                  className={`fd-pill${pending.amenities.includes(opt.value) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, amenities: toggleMulti(p.amenities, opt.value) }))}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </FilterDrawerShell>
  )
}

export function MotorhomeFilterDrawer({ isOpen, onClose, appliedFilters, onApply }: Props<MotorhomeFilterState>) {
  return (
    <FilterDrawerShell isOpen={isOpen} onClose={onClose} appliedFilters={appliedFilters} onApply={onApply} emptyFilters={EMPTY_MOTORHOME_FILTERS}>
      {(pending, setPending) => (
        <div className="fd-section">
          <p className="fd-section-label">Servicios</p>
          <div className="fd-pills">
            {MOTORHOME_SERVICES.map(opt => (
              <button
                key={opt.value}
                className={`fd-pill${pending.services.includes(opt.value) ? " active" : ""}`}
                onClick={() => setPending(p => ({ ...p, services: toggleMulti(p.services, opt.value) }))}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </FilterDrawerShell>
  )
}
