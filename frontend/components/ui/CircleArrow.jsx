"use client"
import { useState } from "react"

export default function CircleArrow({ active, size = 28 }) {
  const [hovered, setHovered] = useState(false)
  const on = active !== undefined ? active : hovered

  return (
    <span
      onMouseEnter={active === undefined ? () => setHovered(true) : undefined}
      onMouseLeave={active === undefined ? () => setHovered(false) : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `1px solid ${on ? "var(--primary-dark)" : "var(--border)"}`,
        background: on ? "var(--primary-dark)" : "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.46,
        color: on ? "#fff" : "var(--muted)",
        flexShrink: 0,
        transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        transform: on ? "translateX(2px)" : "translateX(0)",
      }}
    >
      →
    </span>
  )
}