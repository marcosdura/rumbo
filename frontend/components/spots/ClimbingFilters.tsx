"use client"

import { useEffect, useState } from "react"
import { CLIMBING_FILTERS, ClimbingFilterState, EMPTY_CLIMBING_FILTERS } from "../../lib/climbing-filters"

interface Props {
  isOpen:         boolean
  onClose:        () => void
  appliedFilters: ClimbingFilterState
  onApply:        (f: ClimbingFilterState) => void
}

export default function ClimbingFilterDrawer({ isOpen, onClose, appliedFilters, onApply }: Props) {
  const [pending, setPending]         = useState<ClimbingFilterState>(appliedFilters)
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

  const toggleMulti = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

  const handleApply = () => {
    onApply(pending)
    onClose()
  }

  return (
    <>
      <style>{`
        .cf-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .cf-overlay.active { opacity: 1; }

        .cf-panel {
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
        .cf-panel.active {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }

        .cf-handle { display: none; }

        .cf-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          flex-shrink: 0;
          border-bottom: 1px solid #ede9e1;
        }
        .cf-header-title {
          font-size: 15px;
          font-weight: 700;
          color: #1b1b19;
          margin: 0;
        }
        .cf-close-btn {
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
        .cf-close-btn:hover { background: #ede9e1; }

        .cf-body {
          flex: 1;
          overflow-y: auto;
          padding: 0 24px;
          overscroll-behavior: contain;
        }
        .cf-body::-webkit-scrollbar { width: 4px; }
        .cf-body::-webkit-scrollbar-track { background: transparent; }
        .cf-body::-webkit-scrollbar-thumb { background: #d0cdc7; border-radius: 4px; }

        .cf-section {
          padding: 18px 0 16px;
          border-bottom: 1px solid #ede9e1;
        }
        .cf-section:last-child { border-bottom: none; }
        .cf-section-label {
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
        .cf-section-label::before {
          content: '';
          display: block;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #2d6a4f;
          flex-shrink: 0;
        }

        .cf-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .cf-pill {
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
        .cf-pill:hover {
          background: #f0f7f3;
          color: #1b4332;
          border-color: #b7dfc8;
        }
        .cf-pill.active {
          background: #2d6a4f;
          color: #fff;
          border-color: #2d6a4f;
        }

        .cf-toggle {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 10px 18px;
          border-radius: 20px;
          border: 1px solid #e0ddd6;
          background: #fff;
          color: #3d3d3a;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          user-select: none;
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }
        .cf-toggle:hover {
          background: #f0f7f3;
          color: #1b4332;
          border-color: #b7dfc8;
        }
        .cf-toggle.active {
          background: #2d6a4f;
          color: #fff;
          border-color: #2d6a4f;
        }

        .cf-footer {
          display: flex;
          gap: 10px;
          padding: 16px 24px 20px;
          flex-shrink: 0;
          border-top: 1px solid #ede9e1;
        }
        .cf-btn-clear {
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
        .cf-btn-clear:hover { background: #f5f4f0; color: #1b1b19; }
        .cf-btn-apply {
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
        .cf-btn-apply:hover { background: #1b4332; }

        @media (max-width: 768px) {
          .cf-panel {
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
          .cf-panel.active {
            opacity: 1;
            transform: translateY(0);
          }
          .cf-handle {
            display: block;
            width: 36px; height: 4px;
            border-radius: 2px;
            background: #d0cdc7;
            margin: 12px auto 0;
            flex-shrink: 0;
          }
          .cf-footer {
            padding-bottom: calc(20px + env(safe-area-inset-bottom));
          }
        }
      `}</style>

      <div className={`cf-overlay${animatingIn ? " active" : ""}`} onClick={onClose} />

      <div className={`cf-panel${animatingIn ? " active" : ""}`}>
        <div className="cf-handle" />

        <div className="cf-header">
          <p className="cf-header-title">Filtrar resultados</p>
          <button className="cf-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="cf-body">

          {/* Tipo de escalada */}
          <div className="cf-section">
            <p className="cf-section-label">Tipo de escalada</p>
            <div className="cf-pills">
              {CLIMBING_FILTERS.type.options.map(opt => (
                <button
                  key={opt.value}
                  className={`cf-pill${pending.types.includes(opt.value) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, types: toggleMulti(p.types, opt.value) }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nivel de grados */}
          <div className="cf-section">
            <p className="cf-section-label">Nivel de grados</p>
            <div className="cf-pills">
              {CLIMBING_FILTERS.gradeRange.options.map(opt => (
                <button
                  key={opt.value}
                  className={`cf-pill${pending.gradeRanges.includes(opt.value) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, gradeRanges: toggleMulti(p.gradeRanges, opt.value) }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Acceso */}
          <div className="cf-section">
            <p className="cf-section-label">Acceso</p>
            <button
              className={`cf-toggle${pending.hasRestrictions ? " active" : ""}`}
              onClick={() => setPending(p => ({ ...p, hasRestrictions: !p.hasRestrictions }))}
            >
              ⚠️ Sin restricciones
            </button>
          </div>

        </div>

        <div className="cf-footer">
          <button className="cf-btn-clear" onClick={() => setPending(EMPTY_CLIMBING_FILTERS)}>
            Limpiar todo
          </button>
          <button className="cf-btn-apply" onClick={handleApply}>
            Aplicar filtros
          </button>
        </div>
      </div>
    </>
  )
}
