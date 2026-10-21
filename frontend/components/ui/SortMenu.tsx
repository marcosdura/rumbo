"use client"

// Un desplegable de opciones con la estética del buscador (SearchBar): el
// <select> nativo dibujaba la flecha pegada al borde y la lista de opciones
// con el estilo del sistema. Para el lector de pantalla sigue siendo un
// selector ("combobox" con su "listbox"), y se usa con el teclado: flechas,
// Enter o Espacio para elegir, Escape para cerrar.
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"

type Option = { value: string; label: string }

export default function SortMenu({ label, value, options, onChange }: {
  label: string
  value: string
  options: readonly Option[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = options.find(o => o.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [open])

  function openMenu() {
    setActive(Math.max(0, options.findIndex(o => o.value === value)))
    setOpen(true)
  }

  function choose(i: number) {
    setOpen(false)
    if (options[i].value !== value) onChange(options[i].value)
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); openMenu() }
      return
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(i => Math.min(options.length - 1, i + 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(i => Math.max(0, i - 1)) }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(active) }
    else if (e.key === "Escape" || e.key === "Tab") setOpen(false)
  }

  return (
    <div ref={rootRef} className="sort-menu">
      <style>{`
        .sort-menu { position: relative; display: inline-block; }
        .sort-menu-btn {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: var(--font-dm-sans), sans-serif; font-size: 13px; font-weight: 600; color: #3d3d3a;
          background: #fff; border: 1px solid var(--border); border-radius: 20px;
          padding: 6px 12px 6px 14px; cursor: pointer; transition: border-color 0.15s, background 0.15s;
        }
        .sort-menu-btn:hover, .sort-menu-btn[aria-expanded="true"] { border-color: #b7dfc8; background: #f7fbf8; }
        /* La flecha de las vías (ViasTable): mira abajo y, abierto, arriba. */
        .sort-menu-chevron { display: inline-block; font-size: 14px; line-height: 1; color: var(--muted); transform: rotate(90deg); transition: transform 0.2s; }
        .sort-menu-btn[aria-expanded="true"] .sort-menu-chevron { transform: rotate(-90deg); color: var(--primary); }
        .sort-menu-list {
          position: absolute; right: 0; top: calc(100% + 8px); min-width: 200px; margin: 0; padding: 6px 0; list-style: none;
          background: #fff; border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 8px 28px rgba(0,0,0,0.09);
          z-index: 50; transform-origin: top right; animation: sortMenuIn 0.18s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes sortMenuIn { from { opacity: 0; transform: translateY(-6px) scale(0.97); } to { opacity: 1; transform: none; } }
        .sort-menu-option {
          display: flex; align-items: center; gap: 8px; padding: 10px 16px; cursor: pointer;
          font-family: var(--font-dm-sans), sans-serif; font-size: 13px; color: #3d3d3a;
        }
        .sort-menu-option.is-active { background: #dff0e8; color: var(--primary-dark); }
        .sort-menu-option[aria-selected="true"] { font-weight: 600; color: var(--primary-dark); }
        .sort-menu-dot { width: 10px; font-size: 10px; color: var(--primary); }
      `}</style>
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        className="sort-menu-btn"
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
      >
        {current.label}
        <span aria-hidden="true" className="sort-menu-chevron">›</span>
      </button>
      {open && (
        <ul id={listId} role="listbox" aria-label={label} className="sort-menu-list">
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              className={`sort-menu-option${i === active ? " is-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={e => { e.preventDefault(); choose(i) }}
            >
              <span aria-hidden="true" className="sort-menu-dot">{o.value === value ? "●" : ""}</span>
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
