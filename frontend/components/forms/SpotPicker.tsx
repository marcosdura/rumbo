"use client"

// Elegir un lugar existente escribiendo (busca por nombre o departamento) o
// tocando su pin en el mapa. Lo usan los selectores de agregar-lugar.
import { useId, useState } from "react"
import dynamic from "next/dynamic"
import { hasCoords, searchSpots, type PickableSpot } from "./spotSearch"

const SpotPickerMap = dynamic(() => import("./SpotPickerMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f5f0" }}>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Cargando mapa...</p>
    </div>
  ),
})

const MAX_RESULTS = 8

export default function SpotPicker({ spots, selectedId, onSelect, placeholder = "Escribí el nombre o el departamento" }: {
  spots: PickableSpot[]
  selectedId: number | null
  onSelect: (id: number) => void
  placeholder?: string
}) {
  const listId = useId()
  const selected = spots.find(sp => sp.id === selectedId) ?? null
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const results = searchSpots(spots, query).slice(0, MAX_RESULTS)
  const onMap = spots.filter(hasCoords)

  function choose(sp: PickableSpot) {
    onSelect(sp.id)
    setQuery("")
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHighlight(h => Math.min(h + 1, results.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)) }
    else if (e.key === "Enter" && open && results[highlight]) { e.preventDefault(); choose(results[highlight]) }
    else if (e.key === "Escape") setOpen(false)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative" }}>
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Buscar lugar"
          placeholder={selected ? selected.name : placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setHighlight(0) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          style={{
            width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 12,
            border: "1px solid var(--border)", fontSize: 14, fontFamily: "inherit", background: "#fff",
          }}
        />
        {open && (
          <ul id={listId} role="listbox" style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 1000,
            listStyle: "none", margin: 0, padding: 6, background: "#fff", borderRadius: 14,
            border: "1px solid var(--border)", boxShadow: "0 8px 28px rgba(0,0,0,0.09)",
            maxHeight: 280, overflowY: "auto",
          }}>
            {results.length === 0 ? (
              <li style={{ fontSize: 13, color: "var(--muted)", padding: "8px 10px" }}>No hay lugares con ese nombre.</li>
            ) : results.map((sp, i) => (
              <li
                key={sp.id}
                role="option"
                aria-selected={sp.id === selectedId}
                // onMouseDown y no onClick: el blur del input cierra la lista antes del click.
                onMouseDown={e => { e.preventDefault(); choose(sp) }}
                onMouseEnter={() => setHighlight(i)}
                style={{
                  padding: "8px 10px", borderRadius: 10, cursor: "pointer", fontSize: 14,
                  background: i === highlight ? "#f0f7f3" : "none",
                  display: "flex", justifyContent: "space-between", gap: 10,
                }}
              >
                <span style={{ color: "#1b1b19", fontWeight: sp.id === selectedId ? 600 : 400 }}>{sp.name}</span>
                {sp.department && <span style={{ color: "var(--muted)", fontSize: 12 }}>{sp.department}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <p style={{ fontSize: 13, color: "var(--primary)", margin: 0 }}>
          📍 Elegiste <strong>{selected.name}</strong>{selected.department ? ` (${selected.department})` : ""}
        </p>
      )}

      {onMap.length > 0 && (
        <div style={{ height: 300, borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}>
          <SpotPickerMap spots={onMap} selectedId={selectedId} onSelect={onSelect} />
        </div>
      )}
      {onMap.length > 0 && (
        <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>También podés tocar un punto del mapa para elegirlo.</p>
      )}
    </div>
  )
}
