"use client"

import { useState } from "react"

const STAR_PATH = "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"

// ─── Modo display ─────────────────────────────────────────────────────────────
export function StarDisplay({ rating, size = 16 }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= rating ? "#f59e0b" : "none"}
          stroke={i <= rating ? "#f59e0b" : "#d0cdc7"}
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={STAR_PATH} />
        </svg>
      ))}
    </div>
  )
}

// ─── Modo interactivo ─────────────────────────────────────────────────────────
export function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={28}
          height={28}
          viewBox="0 0 24 24"
          fill={i <= active ? "#f59e0b" : "none"}
          stroke={i <= active ? "#f59e0b" : "#d0cdc7"}
          strokeWidth={1.5}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          style={{
            cursor: "pointer",
            transition: "transform 0.15s cubic-bezier(0.22, 1, 0.36, 1)",
            transform: i <= active ? "scale(1.15)" : "scale(1)",
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={STAR_PATH} />
        </svg>
      ))}
    </div>
  )
}