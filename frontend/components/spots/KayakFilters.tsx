"use client"

import { useEffect, useState } from "react"
import { KAYAK_FILTERS, KayakFilterState, EMPTY_KAYAK_FILTERS } from "../../lib/kayak-filters"

interface Props {
  isOpen:         boolean
  onClose:        () => void
  appliedFilters: KayakFilterState
  onApply:        (f: KayakFilterState) => void
}

export default function KayakFilterDrawer({ isOpen, onClose, appliedFilters, onApply }: Props) {
  const [pending, setPending]         = useState<KayakFilterState>(appliedFilters)
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

  const toggleMulti = (arr: string[], val: string): string[] =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

  const handleApply = () => {
    onApply(pending)
    onClose()
  }

  return (
    <>
      <style>{`
        .kf-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .kf-overlay.active { opacity: 1; }

        .kf-panel {
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
        .kf-panel.active {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }

        .kf-handle { display: none; }

        .kf-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          flex-shrink: 0;
          border-bottom: 1px solid #ede9e1;
        }
        .kf-header-title {
          font-size: 15px;
          font-weight: 700;
          color: #1b1b19;
          margin: 0;
        }
        .kf-close-btn {
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
        .kf-close-btn:hover { background: #ede9e1; }

        .kf-body {
          flex: 1;
          overflow-y: auto;
          padding: 0 24px;
          overscroll-behavior: contain;
        }
        .kf-body::-webkit-scrollbar { width: 4px; }
        .kf-body::-webkit-scrollbar-track { background: transparent; }
        .kf-body::-webkit-scrollbar-thumb { background: #d0cdc7; border-radius: 4px; }

        .kf-section {
          padding: 18px 0 16px;
          border-bottom: 1px solid #ede9e1;
        }
        .kf-section:last-child { border-bottom: none; }
        .kf-section-label {
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
        .kf-section-label::before {
          content: '';
          display: block;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #2d6a4f;
          flex-shrink: 0;
        }

        .kf-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .kf-pill {
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
        .kf-pill:hover {
          background: #f0f7f3;
          color: #1b4332;
          border-color: #b7dfc8;
        }
        .kf-pill.active {
          background: #2d6a4f;
          color: #fff;
          border-color: #2d6a4f;
        }

        .kf-toggle {
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
        .kf-toggle:hover {
          background: #f0f7f3;
          color: #1b4332;
          border-color: #b7dfc8;
        }
        .kf-toggle.active {
          background: #2d6a4f;
          color: #fff;
          border-color: #2d6a4f;
        }

        .kf-footer {
          display: flex;
          gap: 10px;
          padding: 16px 24px 20px;
          flex-shrink: 0;
          border-top: 1px solid #ede9e1;
        }
        .kf-btn-clear {
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
        .kf-btn-clear:hover { background: #f5f4f0; color: #1b1b19; }
        .kf-btn-apply {
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
        .kf-btn-apply:hover { background: #1b4332; }

        @media (max-width: 768px) {
          .kf-panel {
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
          .kf-panel.active {
            opacity: 1;
            transform: translateY(0);
          }
          .kf-handle {
            display: block;
            width: 36px; height: 4px;
            border-radius: 2px;
            background: #d0cdc7;
            margin: 12px auto 0;
            flex-shrink: 0;
          }
          .kf-footer {
            padding-bottom: calc(20px + env(safe-area-inset-bottom));
          }
        }
      `}</style>

      <div className={`kf-overlay${animatingIn ? " active" : ""}`} onClick={onClose} />

      <div className={`kf-panel${animatingIn ? " active" : ""}`}>
        <div className="kf-handle" />

        <div className="kf-header">
          <p className="kf-header-title">Filtrar resultados</p>
          <button className="kf-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="kf-body">

          {/* Tipo de agua */}
          <div className="kf-section">
            <p className="kf-section-label">Tipo de agua</p>
            <div className="kf-pills">
              {KAYAK_FILTERS.waterType.options.map(opt => (
                <button
                  key={opt.value}
                  className={`kf-pill${pending.waterTypes.includes(opt.value) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, waterTypes: toggleMulti(p.waterTypes, opt.value) }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dificultad */}
          <div className="kf-section">
            <p className="kf-section-label">Dificultad</p>
            <div className="kf-pills">
              {KAYAK_FILTERS.difficulty.options.map(opt => (
                <button
                  key={opt.value}
                  className={`kf-pill${pending.difficulties.includes(opt.value) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, difficulties: toggleMulti(p.difficulties, opt.value) }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duración */}
          <div className="kf-section">
            <p className="kf-section-label">Duración</p>
            <div className="kf-pills">
              {KAYAK_FILTERS.duration.options.map(opt => (
                <button
                  key={opt.value}
                  className={`kf-pill${pending.durations.includes(opt.value) ? " active" : ""}`}
                  onClick={() => setPending(p => ({ ...p, durations: toggleMulti(p.durations, opt.value) }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alquiler */}
          <div className="kf-section">
            <p className="kf-section-label">Servicios</p>
            <button
              className={`kf-toggle${pending.rentalAvailable ? " active" : ""}`}
              onClick={() => setPending(p => ({ ...p, rentalAvailable: !p.rentalAvailable }))}
            >
              🛶 Alquiler de kayaks disponible
            </button>
          </div>

        </div>

        <div className="kf-footer">
          <button className="kf-btn-clear" onClick={() => setPending(EMPTY_KAYAK_FILTERS)}>
            Limpiar todo
          </button>
          <button className="kf-btn-apply" onClick={handleApply}>
            Aplicar filtros
          </button>
        </div>
      </div>
    </>
  )
}
