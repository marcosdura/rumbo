"use client"

// Elegir un lugar de Rumbo por su nombre (GET /spots/suggest: solo los
// publicados).
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { SpotLabel } from "@/lib/blogEditor"

type Suggestion = SpotLabel & { category: string | null }

const DELAY_MS = 250

export default function SpotPicker({ onPick, label = "Buscar un lugar de Rumbo", exclude = [] }: {
  onPick: (spot: SpotLabel) => void
  label?: string
  exclude?: number[]
}) {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<{ for: string; items: Suggestion[] }>({ for: "", items: [] })
  const typed = q.trim()

  useEffect(() => {
    if (typed.length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      api.get<Suggestion[]>("/spots/suggest", { params: { q: typed }, signal: controller.signal })
        .then(({ data }) => setResults({ for: typed, items: Array.isArray(data) ? data : [] }))
        .catch(() => {})
    }, DELAY_MS)
    return () => { clearTimeout(timer); controller.abort() }
  }, [typed])

  const items = results.for === typed && typed.length >= 2 ? results.items.filter(s => !exclude.includes(s.id)) : []

  return (
    <div className="be-spot-picker">
      <input
        className="be-input"
        type="search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder={label}
        aria-label={label}
      />
      {items.length > 0 && (
        <ul className="be-suggest" role="listbox" aria-label="Lugares encontrados">
          {items.map(s => (
            <li key={s.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => { onPick({ id: s.id, name: s.name, slug: s.slug, department: s.department, lat: s.lat, lng: s.lng, available: true }); setQ("") }}
              >
                <strong>{s.name}</strong>
                <span>{[s.category, s.department].filter(Boolean).join(" · ")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {results.for === typed && typed.length >= 2 && items.length === 0 && (
        <p className="be-hint">No hay lugares publicados con ese nombre. Podés agregarlo como punto libre.</p>
      )}
    </div>
  )
}
