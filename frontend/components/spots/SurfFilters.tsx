"use client"

import { useEffect, useState } from "react"
import { SURF_FILTERS, SurfFilterState, EMPTY_SURF_FILTERS } from "../../lib/surf-filters"

interface Props {
  isOpen:         boolean
  onClose:        () => void
  appliedFilters: SurfFilterState
  onApply:        (f: SurfFilterState) => void
}

export default function SurfFilterDrawer({ isOpen, onClose, appliedFilters, onApply }: Props) {
  const [pending, setPending]         = useState<SurfFilterState>(appliedFilters)
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
        .sf-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .sf-overlay.active { opacity: 1; }

        .sf-panel {
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
        .sf-panel.active {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }

        .sf-handle { display: none; }

        .sf-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          flex-shrink: 0;
          border-bottom: 1px solid #ede9e1;
        }
        .sf-header-title {
          font-size: 15px;
          font-weight: 700;
          color: #1b1b19;
          margin: 0;
        }
        .sf-close-btn {
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
        .sf-close-btn:hover { background: #ede9e1; }

        .sf-body {
          flex: 1;
          overflow-y: auto;
          padding: 0 24px;
          overscroll-behavior: contain;
        }
        .sf-body::-webkit-scrollbar { width: 4px; }
        .sf-body::-webkit-scrollbar-track { background: transparent; }
        .sf-body::-webkit-scrollbar-thumb { background: #d0cdc7; border-radius: 4px; }

        .sf-section {
          padding: 18px 0 16px;
          border-bottom: 1px solid #ede9e1;
        }
        .sf-section:last-child { border-bottom: none; }
        .sf-section-label {
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
        .sf-section-label::before {
          content: '';
          display: block;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #2d6a4f;
          flex-shrink: 0;
        }

        .sf-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sf-pill {
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
        .sf-pill:hover {
          background: #f0f7f3;
          color: #1b4332;
          border-color: #b7dfc8;
        }
        .sf-pill.active {
          background: #2d6a4f;
          color: #fff;
          border-color: #2d6a4f;
        }

        .sf-toggles {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sf-toggle {
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
        .sf-toggle:hover {
          background: #f0f7f3;
          color: #1b4332;
          border-color: #b7dfc8;
        }
        .sf-toggle.active {
          background: #2d6a4f;
          color: #fff;
          border-color: #2d6a4f;
        }

        .sf-footer {
          display: flex;
          gap: 10px;
          padding: 16px 24px 20px;
          flex-shrink: 0;
          border-top: 1px solid #ede9e1;
        }
        .sf-btn-clear {
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
        .sf-btn-clear:hover { background: #f5f4f0; color: #1b1b19; }
        .sf-btn-apply {
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
        .sf-btn-apply:hover { background: #1b4332; }

        @media (max-width: 768px) {
          .sf-panel {
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
          .sf-panel.active {
            opacity: 1;
            transform: translateY(0);
          }
          .sf-handle {
            display: block;
            width: 36px; height: 4px;
            border-radius: 2px;
            background: #d0cdc7;
            margin: 12px auto 0;
            flex-shrink: 0;
          }
          .sf-footer {
            padding-bottom: calc(20px + env(safe-area-inset-bottom));
          }
        }
      `}</style>

      <div className={`sf-overlay${animatingIn ? " active" : ""}`} onClick={onClose} />

      <div className={`sf-panel${animatingIn ? " active" : ""}`}>
        <div className="sf-handle" />

        <div className="sf-header">
          <p className="sf-header-title">Filtrar resultados</p>
          <button className="sf-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="sf-body">

          {/* Tipo de clase */}
          <div className="sf-section">
            <p className="sf-section-label">Tipo de clase</p>
            <div className="sf-pills">
              {SURF_FILTERS.classType.options.map(opt => (
                <button
                  key={opt.value}
                  className={`sf-pill${pending.classTypes.includes(opt.value) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, classTypes: toggleMulti(p.classTypes, opt.value) }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duración */}
          <div className="sf-section">
            <p className="sf-section-label">Duración</p>
            <div className="sf-pills">
              {SURF_FILTERS.duration.options.map(opt => (
                <button
                  key={opt.value}
                  className={`sf-pill${pending.durations.includes(opt.value) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, durations: toggleMulti(p.durations, opt.value) }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Servicios */}
          <div className="sf-section">
            <p className="sf-section-label">Servicios</p>
            <div className="sf-toggles">
              <button
                className={`sf-toggle${pending.hasSurfSchool ? " active" : ""}`}
                onClick={() => setPending(p => ({ ...p, hasSurfSchool: !p.hasSurfSchool }))}
              >
                🏄 Tiene escuela de surf
              </button>
              <button
                className={`sf-toggle${pending.equipmentIncluded ? " active" : ""}`}
                onClick={() => setPending(p => ({ ...p, equipmentIncluded: !p.equipmentIncluded }))}
              >
                🎽 Equipamiento incluido
              </button>
            </div>
          </div>

        </div>

        <div className="sf-footer">
          <button className="sf-btn-clear" onClick={() => setPending(EMPTY_SURF_FILTERS)}>
            Limpiar todo
          </button>
          <button className="sf-btn-apply" onClick={handleApply}>
            Aplicar filtros
          </button>
        </div>
      </div>
    </>
  )
}
