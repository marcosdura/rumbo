const VARIANTS = {
  neutral:         { bg: "#f7f5f0", color: "#4a443b", border: "#e0ddd6" },
  beige:           { bg: "#eae6df", color: "#4a443b", border: "#d0c9bc" },
  green:           { bg: "#e8f5ee", color: "#1b4332", border: "#b7dfc8" },
  "dark-green":    { bg: "#1b4332", color: "#d8f3dc", border: "#2d6a4f" },
  "subtle-green":  { bg: "#f0f7f3", color: "#2d6a4f", border: "#c0ddd0" },
  yellow:          { bg: "#fef9e7", color: "#78590a", border: "#f0d98a" },
  red:             { bg: "#fdf0f0", color: "#7c1d1d", border: "#f5c0c0" },
  orange:          { bg: "#fff4e6", color: "#7c4a03", border: "#f5c97a" },
  muted:           { bg: "#f7f5f0", color: "#9a9690", border: "#e0ddd6" },
}

export default function Pill({ variant = "neutral", bg, color, border, label, style, children }) {
  const base = VARIANTS[variant] || VARIANTS.neutral
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: "0.03em",
        color: color ?? base.color,
        background: bg ?? base.bg,
        border: `1px solid ${border ?? base.border}`,
        ...style,
      }}
    >
      {children ?? label}
    </span>
  )
}