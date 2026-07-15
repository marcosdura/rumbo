"use client"

import type { CSSProperties, ReactNode } from "react"

export type PillVariant =
  | "neutral" | "beige" | "green" | "dark-green" | "subtle-green"
  | "yellow" | "red" | "orange" | "muted"
export type PillSize = "sm" | "md" | "lg"

const VARIANTS: Record<PillVariant, { bg: string; color: string; border: string }> = {
  neutral:        { bg: "#f7f5f0", color: "#4a443b", border: "#e0ddd6" },
  beige:          { bg: "#eae6df", color: "#4a443b", border: "#d0c9bc" },
  green:          { bg: "#e8f5ee", color: "#1b4332", border: "#b7dfc8" },
  "dark-green":   { bg: "#1b4332", color: "#d8f3dc", border: "#2d6a4f" },
  "subtle-green": { bg: "#f0f7f3", color: "#2d6a4f", border: "#c0ddd0" },
  yellow:         { bg: "#fef9e7", color: "#78590a", border: "#f0d98a" },
  red:            { bg: "#fdf0f0", color: "#7c1d1d", border: "#f5c0c0" },
  orange:         { bg: "#fff4e6", color: "#7c4a03", border: "#f5c97a" },
  muted:          { bg: "#f7f5f0", color: "#9a9690", border: "#e0ddd6" },
}

// Tinte de hover por variant. green/red son pixel-idénticos a los
// .hover-lift-green / .hover-lift-red que reemplazan (sin regresión visual).
const HOVER: Record<PillVariant, { bg: string; border: string; shadow: string }> = {
  neutral:        { bg: "#f4f1ec", border: "#d3cfc5", shadow: "rgba(0,0,0,0.07)" },
  beige:          { bg: "#e6e2da", border: "#c3bbab", shadow: "rgba(0,0,0,0.07)" },
  green:          { bg: "#f0f7f3", border: "#b7dfc8", shadow: "rgba(0,0,0,0.07)" },
  "dark-green":   { bg: "#204f3b", border: "#357a5a", shadow: "rgba(0,0,0,0.07)" },
  "subtle-green": { bg: "#e9f3ee", border: "#a9cfbc", shadow: "rgba(0,0,0,0.07)" },
  yellow:         { bg: "#fcf4d9", border: "#e6c766", shadow: "rgba(0,0,0,0.07)" },
  red:            { bg: "#fdeaea", border: "#f0a3a3", shadow: "rgba(220,38,38,0.1)" },
  orange:         { bg: "#fdeed6", border: "#eeb45c", shadow: "rgba(0,0,0,0.07)" },
  muted:          { bg: "#f4f1ec", border: "#d3cfc5", shadow: "rgba(0,0,0,0.07)" },
}

const SIZES: Record<PillSize, { padding: string; fontSize: number; gap: number }> = {
  sm: { padding: "3px 8px",  fontSize: 10, gap: 4 },
  md: { padding: "4px 10px", fontSize: 11, gap: 5 },
  lg: { padding: "6px 12px", fontSize: 13, gap: 7 },
}

interface PillProps {
  variant?: PillVariant
  size?: PillSize
  hover?: boolean
  bg?: string
  color?: string
  border?: string
  label?: ReactNode
  style?: CSSProperties
  className?: string
  children?: ReactNode
}

export default function Pill({
  variant = "neutral", size = "md", hover = false,
  bg, color, border, label, style, className, children,
}: PillProps) {
  const base = VARIANTS[variant] || VARIANTS.neutral
  const s = SIZES[size]
  const isCustom = bg != null || color != null || border != null
  const hoverVars = hover && !isCustom
    ? {
        "--pill-hover-bg": HOVER[variant].bg,
        "--pill-hover-border": HOVER[variant].border,
        "--pill-hover-shadow": HOVER[variant].shadow,
      } as CSSProperties
    : {}

  return (
    <span
      className={[hover && !isCustom ? "pill-hover" : "", className].filter(Boolean).join(" ")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        padding: s.padding,
        borderRadius: 999,
        fontSize: s.fontSize,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: "0.03em",
        userSelect: "none",
        color: color ?? base.color,
        background: bg ?? base.bg,
        border: `1px solid ${border ?? base.border}`,
        ...hoverVars,
        ...style,
      }}
    >
      {children ?? label}
    </span>
  )
}
