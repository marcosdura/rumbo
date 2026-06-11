"use client"

import { CATEGORIES } from "../constants"
import { s } from "../styles"
import type { Category } from "../types"

export default function StepCategoria({ onSelect }: { onSelect: (cat: Category) => void }) {
  return (
    <div>
      <h2 style={s.title}>¿Qué tipo de lugar es?</h2>
      <div style={s.catGrid}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} style={s.catCard} onClick={() => onSelect(cat)}>
            <span style={{ fontSize: 32 }}>{cat.emoji}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#1b1b19" }}>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
