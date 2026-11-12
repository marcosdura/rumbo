"use client"

// Una lista para marcar ("Qué llevar"). Lo marcado se recuerda en este
// navegador; en privado o sin permiso para guardar, dura lo que la visita.
import { useCallback, useState, useSyncExternalStore } from "react"

type Props = { storageKey: string; title: string | null; items: string[] }

const EVENT = "rumbo-checklist"

function readRaw(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "[]"
  } catch {
    return "[]"
  }
}

function parse(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((n): n is number => Number.isInteger(n)) : []
  } catch {
    return []
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => { window.removeEventListener(EVENT, onChange); window.removeEventListener("storage", onChange) }
}

export default function Checklist({ storageKey, title, items }: Props) {
  // Si no se puede guardar, lo marcado vive acá.
  const [fallback, setFallback] = useState<string | null>(null)
  const stored = useSyncExternalStore(subscribe, () => readRaw(storageKey), () => "[]")
  const checked = parse(fallback ?? stored)

  const toggle = useCallback((i: number) => {
    const next = JSON.stringify(checked.includes(i) ? checked.filter(n => n !== i) : [...checked, i])
    try {
      window.localStorage.setItem(storageKey, next)
      window.dispatchEvent(new Event(EVENT))
    } catch {
      setFallback(next)
    }
  }, [checked, storageKey])

  const done = items.filter((_, i) => checked.includes(i)).length
  return (
    <div className="blog-checklist">
      <div className="blog-checklist-head">
        <p className="blog-checklist-title">✅ {title ?? "Checklist"}</p>
        <span className="blog-checklist-count">{done}/{items.length}</span>
      </div>
      <ul>
        {items.map((item, i) => (
          <li key={i}>
            <label className={checked.includes(i) ? "is-done" : undefined}>
              <input type="checkbox" checked={checked.includes(i)} onChange={() => toggle(i)} />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
