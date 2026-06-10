"use client"

import { useEffect, useState } from "react"
import {
  CAMPING_AMENITY_GROUPS,
  CAMPING_PRICE_RANGES,
  CampingFilterState,
  EMPTY_CAMPING_FILTERS,
} from "../../lib/camping-filters"

interface Props {
  isOpen:         boolean
  onClose:        () => void
  appliedFilters: CampingFilterState
  onApply:        (f: CampingFilterState) => void
}

export default function CampingFilterDrawer({ isOpen, onClose, appliedFilters, onApply }: Props) {
  const [pending, setPending]         = useState<CampingFilterState>(appliedFilters)
  const [visible, setVisible]         = useState(false)
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

  const handleApply = () => {
    onApply(pending)
    onClose()
  }

  return (
    <>
      <style>{`
        .cm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .cm-overlay.active { opacity: 1; }

        .cm-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.95);
          width: 520px;
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
        .cm-panel.active {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }

        .cm-handle { display: none; }

        .cm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          flex-shrink: 0;
          border-bottom: 1px solid #ede9e1;
        }
        .cm-header-title {
          font-size: 15px;
          font-weight: 700;
          color: #1b1b19;
          margin: 0;
        }
        .cm-close-btn {
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
        .cm-close-btn:hover { background: #ede9e1; }

        .cm-body {
          flex: 1;
          overflow-y: auto;
          padding: 0 24px;
          overscroll-behavior: contain;
        }
        .cm-body::-webkit-scrollbar { width: 4px; }
        .cm-body::-webkit-scrollbar-track { background: transparent; }
        .cm-body::-webkit-scrollbar-thumb { background: #d0cdc7; border-radius: 4px; }

        .cm-section {
          padding: 18px 0 16px;
          border-bottom: 1px solid #ede9e1;
        }
        .cm-section:last-child { border-bottom: none; }

        .cm-section-label {
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
        .cm-section-label::before {
          content: '';
          display: block;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #2d6a4f;
          flex-shrink: 0;
        }

        .cm-group-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #9a9690;
          margin: 0 0 8px;
        }

        .cm-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .cm-pill {
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
        .cm-pill:hover {
          background: #f0f7f3;
          color: #1b4332;
          border-color: #b7dfc8;
        }
        .cm-pill.active {
          background: #2d6a4f;
          color: #fff;
          border-color: #2d6a4f;
        }

        .cm-footer {
          display: flex;
          gap: 10px;
          padding: 16px 24px 20px;
          flex-shrink: 0;
          border-top: 1px solid #ede9e1;
        }
        .cm-btn-clear {
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
        .cm-btn-clear:hover { background: #f5f4f0; color: #1b1b19; }
        .cm-btn-apply {
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
        .cm-btn-apply:hover { background: #1b4332; }

        @media (max-width: 768px) {
          .cm-panel {
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
          .cm-panel.active {
            opacity: 1;
            transform: translateY(0);
          }
          .cm-handle {
            display: block;
            width: 36px; height: 4px;
            border-radius: 2px;
            background: #d0cdc7;
            margin: 12px auto 0;
            flex-shrink: 0;
          }
          .cm-footer {
            padding-bottom: calc(20px + env(safe-area-inset-bottom));
          }
        }
      `}</style>

      <div className={`cm-overlay${animatingIn ? " active" : ""}`} onClick={onClose} />

      <div className={`cm-panel${animatingIn ? " active" : ""}`}>
        <div className="cm-handle" />

        <div className="cm-header">
          <p className="cm-header-title">Filtrar resultados</p>
          <button className="cm-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="cm-body">

          {/* Precio */}
          <div className="cm-section">
            <p className="cm-section-label">Precio</p>
            <div className="cm-pills">
              {CAMPING_PRICE_RANGES.map(opt => (
                <button
                  key={opt.value}
                  className={`cm-pill${pending.priceRanges.includes(opt.value) ? " active" : ""}`}
                  onClick={() => togglePrice(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amenidades agrupadas */}
          {CAMPING_AMENITY_GROUPS.map((group, gi) => (
            <div key={group.label} className="cm-section">
              <p className="cm-section-label">{group.label}</p>
              <div className="cm-pills">
                {group.amenities.map(amenity => (
                  <button
                    key={amenity.id}
                    className={`cm-pill${pending.amenityIds.includes(amenity.id) ? " active" : ""}`}
                    onClick={() => toggleAmenity(amenity.id)}
                  >
                    {amenity.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

        </div>

        <div className="cm-footer">
          <button className="cm-btn-clear" onClick={() => setPending(EMPTY_CAMPING_FILTERS)}>
            Limpiar todo
          </button>
          <button className="cm-btn-apply" onClick={handleApply}>
            Aplicar filtros
          </button>
        </div>
      </div>
    </>
  )
}
