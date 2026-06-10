"use client"

import { useEffect, useState } from "react"
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

export default function FilterDrawer({ isOpen, onClose, appliedFilters, onApply }: Props) {
  const [pending, setPending]       = useState<TrekkingFilterState>(appliedFilters)
  const [visible, setVisible]       = useState(false)
  const [animatingIn, setAnimatingIn] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPending(appliedFilters)
      setVisible(true)
      requestAnimationFrame(() => setAnimatingIn(true))
    } else {
      setAnimatingIn(false)
      const timer = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!visible) return null

  const toggleMulti = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

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

  const handleApply = () => {
    onApply(pending)
    onClose()
  }

  return (
    <>
      <style>{`
        .filter-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .filter-overlay.active { opacity: 1; }

        .filter-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.95);
          width: 480px;
          max-height: 90vh;
          border-radius: 20px;
          background: #fff;
          z-index: 1001;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          font-family: 'DM Sans', sans-serif;
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        .filter-panel.active {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }

        .filter-handle { display: none; }

        .filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          flex-shrink: 0;
          border-bottom: 1px solid #ede9e1;
        }
        .filter-header-title {
          font-size: 15px;
          font-weight: 700;
          color: #1b1b19;
          margin: 0;
        }
        .filter-close-btn {
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 1px solid #e0ddd6;
          background: #f5f4f0;
          color: #7a7669;
          font-size: 14px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
          flex-shrink: 0;
        }
        .filter-close-btn:hover { background: #ede9e1; }

        .filter-body {
          flex: 1;
          overflow-y: auto;
          padding: 0 24px;
          overscroll-behavior: contain;
        }
        .filter-body::-webkit-scrollbar { width: 4px; }
        .filter-body::-webkit-scrollbar-track { background: transparent; }
        .filter-body::-webkit-scrollbar-thumb { background: #d0cdc7; border-radius: 4px; }

        .filter-section {
          padding: 18px 0 16px;
          border-bottom: 1px solid #ede9e1;
        }
        .filter-section:last-child { border-bottom: none; }
        .filter-section-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #2d6a4f;
          margin: 0 0 12px;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .filter-section-label::before {
          content: '';
          display: block;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #2d6a4f;
          flex-shrink: 0;
        }

        .filter-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .filter-pill {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 7px 16px;
          border-radius: 20px;
          border: 1px solid #e0ddd6;
          background: #fff;
          color: #3d3d3a;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          user-select: none;
          line-height: 1;
        }
        .filter-pill:hover {
          background: #f0f7f3;
          color: #1b4332;
          border-color: #b7dfc8;
        }
        .filter-pill.active {
          background: #2d6a4f;
          color: #fff;
          border-color: #2d6a4f;
        }

        .filter-footer {
          display: flex;
          gap: 10px;
          padding: 16px 24px 20px;
          flex-shrink: 0;
          border-top: 1px solid #ede9e1;
        }
        .filter-btn-clear {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 12px;
          border: 1px solid #e0ddd6;
          background: #fff;
          color: #7a7669;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .filter-btn-clear:hover { background: #f5f4f0; color: #1b1b19; }
        .filter-btn-apply {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          padding: 10px 20px;
          border-radius: 12px;
          border: none;
          background: #2d6a4f;
          color: #fff;
          cursor: pointer;
          flex: 1;
          transition: background 0.15s;
        }
        .filter-btn-apply:hover { background: #1b4332; }

        @media (max-width: 768px) {
          .filter-panel {
            top: auto;
            left: 0;
            bottom: 0;
            width: 100%;
            max-height: 85vh;
            border-radius: 20px 20px 0 0;
            opacity: 1;
            transform: translateY(100%);
            transition: transform 0.3s ease-out;
          }
          .filter-panel.active {
            opacity: 1;
            transform: translateY(0);
          }
          .filter-handle {
            display: block;
            width: 36px; height: 4px;
            border-radius: 2px;
            background: #d0cdc7;
            margin: 12px auto 0;
            flex-shrink: 0;
          }
          .filter-footer {
            padding-bottom: calc(20px + env(safe-area-inset-bottom));
          }
        }
      `}</style>

      <div className={`filter-overlay${animatingIn ? " active" : ""}`} onClick={onClose} />

      <div className={`filter-panel${animatingIn ? " active" : ""}`}>
        <div className="filter-handle" />

        <div className="filter-header">
          <p className="filter-header-title">Filtrar resultados</p>
          <button className="filter-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="filter-body">

          {/* Dificultad */}
          <div className="filter-section">
            <p className="filter-section-label">Dificultad</p>
            <div className="filter-pills">
              {TREKKING_FILTERS.difficulty.options.map(opt => (
                <button
                  key={opt.value}
                  className={`filter-pill${pending.difficulties.includes(opt.value as DifficultyValue) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, difficulties: toggleMulti(p.difficulties, opt.value as DifficultyValue) }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duración */}
          <div className="filter-section">
            <p className="filter-section-label">Duración</p>
            <div className="filter-pills">
              {TREKKING_FILTERS.duration.options.map(opt => (
                <button
                  key={opt.value}
                  className={`filter-pill${pending.durations.includes(opt.value as DurationValue) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, durations: toggleMulti(p.durations, opt.value as DurationValue) }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Distancia */}
          <div className="filter-section">
            <p className="filter-section-label">Distancia</p>
            <div className="filter-pills">
              {TREKKING_FILTERS.distance.options.map(opt => (
                <button
                  key={opt.value}
                  className={`filter-pill${pending.distances.includes(opt.value as DistanceValue) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, distances: toggleMulti(p.distances, opt.value as DistanceValue) }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Servicios */}
          <div className="filter-section">
            <p className="filter-section-label">Servicios</p>
            <div className="filter-pills">
              {TREKKING_FILTERS.amenities.map(a => (
                <button
                  key={a.key}
                  className={`filter-pill${pending.amenities[a.key as AmenityKey] ? " active" : ""}`}
                  onClick={() => toggleAmenity(a.key as AmenityKey)}
                >
                  {a.emoji} {a.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="filter-footer">
          <button className="filter-btn-clear" onClick={() => setPending(EMPTY_TREKKING_FILTERS)}>
            Limpiar todo
          </button>
          <button className="filter-btn-apply" onClick={handleApply}>
            Aplicar filtros
          </button>
        </div>
      </div>
    </>
  )
}
