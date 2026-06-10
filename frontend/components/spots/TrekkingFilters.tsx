"use client"

import { TREKKING_FILTERS, DifficultyValue, DurationValue, AmenityKey } from "../../lib/trekking-filters"

export interface TrekkingFilterState {
  difficulties: DifficultyValue[]
  duration:     DurationValue | null
  amenities:    Partial<Record<AmenityKey, boolean>>
}

export const EMPTY_TREKKING_FILTERS: TrekkingFilterState = {
  difficulties: [],
  duration:     null,
  amenities:    {},
}

export function hasTrekkingFilters(f: TrekkingFilterState) {
  return (
    f.difficulties.length > 0 ||
    f.duration !== null ||
    Object.keys(f.amenities).length > 0
  )
}

interface Props {
  visible:  boolean
  filters:  TrekkingFilterState
  onChange: (next: TrekkingFilterState) => void
}

export default function TrekkingFilters({ visible, filters, onChange }: Props) {
  const toggleDifficulty = (v: DifficultyValue) => {
    const next = filters.difficulties.includes(v)
      ? filters.difficulties.filter(d => d !== v)
      : [...filters.difficulties, v]
    onChange({ ...filters, difficulties: next })
  }

  const setDuration = (v: DurationValue) => {
    onChange({ ...filters, duration: filters.duration === v ? null : v })
  }

  const toggleAmenity = (k: AmenityKey) => {
    const cur = filters.amenities
    if (cur[k]) {
      const next = { ...cur }
      delete next[k]
      onChange({ ...filters, amenities: next })
    } else {
      onChange({ ...filters, amenities: { ...cur, [k]: true } })
    }
  }

  const clearAll = () => onChange(EMPTY_TREKKING_FILTERS)

  const hasAny = hasTrekkingFilters(filters)

  return (
    <>
      <style>{`
        .trek-filters-wrap {
          overflow: hidden;
          transition: max-height 0.22s cubic-bezier(0.22, 1, 0.36, 1),
                      opacity    0.18s ease;
        }
        .trek-filters-wrap.hidden {
          max-height: 0;
          opacity: 0;
          pointer-events: none;
        }
        .trek-filters-wrap.visible {
          max-height: 400px;
          opacity: 1;
        }
        .trek-filters-inner {
          padding: 12px 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .trek-filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .trek-filter-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #7a7669;
          min-width: 72px;
          flex-shrink: 0;
        }
        .trek-pills {
          display: flex;
          gap: 6px;
          flex-wrap: nowrap;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .trek-pills::-webkit-scrollbar { display: none; }
        .trek-pill {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid #e0ddd6;
          background: #fff;
          color: #7a7669;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          line-height: 1;
          user-select: none;
          flex-shrink: 0;
        }
        .trek-pill:hover {
          background: #f0f7f3;
          color: #1b4332;
          border-color: #b7dfc8;
        }
        .trek-pill.active {
          background: #e8f5ee;
          color: #1b4332;
          border-color: #2d6a4f;
        }
        .trek-clear-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #9a9690;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .trek-clear-btn:hover { color: #1b4332; background: #f0f7f3; }
        .trek-divider {
          height: 1px;
          background: #ede9e1;
          margin: 0 24px;
        }
      `}</style>

      <div className={`trek-filters-wrap ${visible ? "visible" : "hidden"}`}>
        <div className="trek-divider" />
        <div className="trek-filters-inner">

          {/* Dificultad */}
          <div className="trek-filter-row">
            <span className="trek-filter-label">Dificultad</span>
            <div className="trek-pills">
              {TREKKING_FILTERS.difficulty.options.map(opt => (
                <button
                  key={opt.value}
                  className={`trek-pill${filters.difficulties.includes(opt.value as DifficultyValue) ? " active" : ""}`}
                  onClick={() => toggleDifficulty(opt.value as DifficultyValue)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duración */}
          <div className="trek-filter-row">
            <span className="trek-filter-label">Duración</span>
            <div className="trek-pills">
              {TREKKING_FILTERS.duration.options.map(opt => (
                <button
                  key={opt.value}
                  className={`trek-pill${filters.duration === opt.value ? " active" : ""}`}
                  onClick={() => setDuration(opt.value as DurationValue)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amenidades */}
          <div className="trek-filter-row">
            <span className="trek-filter-label">Servicios</span>
            <div className="trek-pills">
              {TREKKING_FILTERS.amenities.map(a => (
                <button
                  key={a.key}
                  className={`trek-pill${filters.amenities[a.key as AmenityKey] ? " active" : ""}`}
                  onClick={() => toggleAmenity(a.key as AmenityKey)}
                >
                  {a.emoji} {a.label}
                </button>
              ))}
            </div>
          </div>

          {hasAny && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="trek-clear-btn" onClick={clearAll}>
                Limpiar filtros
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
