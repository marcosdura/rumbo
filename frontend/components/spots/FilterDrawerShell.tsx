"use client"

import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { useModalA11y } from "@/lib/useModalA11y"

// Los 5 drawers de filtro (Trekking/Kayak/Surf/Climbing/Camping) eran el
// mismo "shell" copiado 5 veces — mismo estado pending/visible/animatingIn,
// mismo efecto de apertura/cierre, mismo JSX de overlay/panel/header/footer,
// mismo CSS entero salvo el ancho del panel y si hay o no toggles. El
// contenido de cada filtro (los campos en sí) sigue viviendo en cada
// componente — eso no es genéricamente unificable hoy sin antes normalizar
// los 5 lib/*-filters.ts (formas distintas, toggles booleanos hardcodeados
// fuera de la config), así que queda igual, pasado acá como children.
type Props<T> = {
  isOpen: boolean
  onClose: () => void
  appliedFilters: T
  onApply: (f: T) => void
  emptyFilters: T
  width?: number
  children: (pending: T, setPending: Dispatch<SetStateAction<T>>) => ReactNode
}

export default function FilterDrawerShell<T>({
  isOpen, onClose, appliedFilters, onApply, emptyFilters, width = 480, children,
}: Props<T>) {
  const [pending, setPending]         = useState<T>(appliedFilters)
  const [visible, setVisible]         = useState(false)
  const [animatingIn, setAnimatingIn] = useState(false)
  const panelRef = useModalA11y(isOpen, onClose)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!visible) return null

  const handleApply = () => {
    onApply(pending)
    onClose()
  }

  return (
    <>
      <style>{`
        .fd-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .fd-overlay.active { opacity: 1; }

        .fd-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.95);
          width: var(--fd-width, 480px);
          max-height: 90vh;
          border-radius: 20px;
          background: #fff;
          z-index: 1001;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          font-family: var(--font-dm-sans), sans-serif;
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        .fd-panel.active {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }

        .fd-handle { display: none; }

        .fd-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          flex-shrink: 0;
          border-bottom: 1px solid #ede9e1;
        }
        .fd-header-title {
          font-size: 15px;
          font-weight: 700;
          color: #1b1b19;
          margin: 0;
        }
        .fd-close-btn {
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: #f5f4f0;
          color: var(--muted-strong);
          font-size: 14px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
          flex-shrink: 0;
        }
        .fd-close-btn:hover { background: #ede9e1; }

        .fd-body {
          flex: 1;
          overflow-y: auto;
          padding: 0 24px;
          overscroll-behavior: contain;
        }
        .fd-body::-webkit-scrollbar { width: 4px; }
        .fd-body::-webkit-scrollbar-track { background: transparent; }
        .fd-body::-webkit-scrollbar-thumb { background: #d0cdc7; border-radius: 4px; }

        .fd-section {
          padding: 18px 0 16px;
          border-bottom: 1px solid #ede9e1;
        }
        .fd-section:last-child { border-bottom: none; }
        .fd-section-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--primary);
          margin: 0 0 12px;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .fd-section-label::before {
          content: '';
          display: block;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--primary);
          flex-shrink: 0;
        }

        .fd-group-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 0 0 8px;
        }

        .fd-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .fd-pill {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 7px 16px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: #fff;
          color: #3d3d3a;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          user-select: none;
          line-height: 1;
        }
        .fd-pill:hover {
          background: #f0f7f3;
          color: var(--primary-dark);
          border-color: #b7dfc8;
        }
        .fd-pill.active {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }

        .fd-toggles {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .fd-toggle {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 10px 18px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: #fff;
          color: #3d3d3a;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          user-select: none;
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }
        .fd-toggle:hover {
          background: #f0f7f3;
          color: var(--primary-dark);
          border-color: #b7dfc8;
        }
        .fd-toggle.active {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }

        .fd-footer {
          display: flex;
          gap: 10px;
          padding: 16px 24px 20px;
          flex-shrink: 0;
          border-top: 1px solid #ede9e1;
        }
        .fd-btn-clear {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: #fff;
          color: var(--muted-strong);
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .fd-btn-clear:hover { background: #f5f4f0; color: #1b1b19; }
        .fd-btn-apply {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 13px;
          font-weight: 700;
          padding: 10px 20px;
          border-radius: 12px;
          border: none;
          background: var(--primary);
          color: #fff;
          cursor: pointer;
          flex: 1;
          transition: background 0.15s;
        }
        .fd-btn-apply:hover { background: var(--primary-dark); }

        @media (max-width: 768px) {
          .fd-panel {
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
          .fd-panel.active {
            opacity: 1;
            transform: translateY(0);
          }
          .fd-handle {
            display: block;
            width: 36px; height: 4px;
            border-radius: 2px;
            background: #d0cdc7;
            margin: 12px auto 0;
            flex-shrink: 0;
          }
          .fd-footer {
            padding-bottom: calc(20px + env(safe-area-inset-bottom));
          }
        }
      `}</style>

      <div className={`fd-overlay${animatingIn ? " active" : ""}`} onClick={onClose} />

      <div
        ref={panelRef}
        className={`fd-panel${animatingIn ? " active" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
        tabIndex={-1}
        style={{ "--fd-width": `${width}px` } as React.CSSProperties}
      >
        <div className="fd-handle" />

        <div className="fd-header">
          <p className="fd-header-title" id="filter-drawer-title">Filtrar resultados</p>
          <button className="fd-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="fd-body">
          {children(pending, setPending)}
        </div>

        <div className="fd-footer">
          <button className="fd-btn-clear" onClick={() => setPending(emptyFilters)}>
            Limpiar todo
          </button>
          <button className="fd-btn-apply" onClick={handleApply}>
            Aplicar filtros
          </button>
        </div>
      </div>
    </>
  )
}
