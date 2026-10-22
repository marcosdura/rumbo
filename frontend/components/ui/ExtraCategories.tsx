"use client"

// El "+n" de las actividades que no entran (en la card y en la página de un
// lugar): con mouse se ven al pasar por encima; en pantallas táctiles, con un
// toque, y se cierran al tocar en cualquier otro lado o al scrollear.
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Pill, { type PillVariant } from "@/components/ui/Pill"

// Se pregunta en el momento (antes cada card escuchaba el resize de la ventana).
const canHover = () => typeof window !== "undefined" && !!window.matchMedia?.("(hover: hover)").matches

export default function ExtraCategories({ categories, emoji, variant = "beige", className }: {
  categories: { name: string }[]
  emoji: Record<string, string>
  variant?: PillVariant
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (e.type === "pointerdown" && ref.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener("pointerdown", close, true)
    window.addEventListener("scroll", close, true)
    return () => {
      document.removeEventListener("pointerdown", close, true)
      window.removeEventListener("scroll", close, true)
    }
  }, [open])

  const show = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    setPos({ left: rect.left, bottom: window.innerHeight - rect.top + 6 })
    setOpen(true)
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{ position: "relative", flexShrink: 0 }}
      onMouseEnter={(e) => { if (canHover()) show(e.currentTarget) }}
      onMouseLeave={() => canHover() && setOpen(false)}
      onClick={(e) => {
        if (canHover()) return
        // Adentro de un link (la card): no navegar.
        e.preventDefault()
        e.stopPropagation()
        if (open) setOpen(false)
        else show(e.currentTarget)
      }}
    >
      <Pill variant={variant}>+{categories.length}</Pill>
      {open && pos && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed", left: pos.left, bottom: pos.bottom,
            background: "#1b1b19", color: "#fff", borderRadius: 10,
            padding: "8px 10px", fontSize: 12, whiteSpace: "nowrap",
            display: "flex", flexDirection: "column", gap: 4,
            zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
          }}
        >
          {categories.map(c => (
            <span key={c.name}>{`${emoji[c.name] ?? ""} ${c.name}`.trim()}</span>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
