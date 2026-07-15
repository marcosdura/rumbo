"use client"

type Tone = "neutral" | "positive" | "negative"

interface AmenityPillProps {
  emoji: string
  label: string
  tone?: Tone
}

const TONE_STYLES: Record<Exclude<Tone, "neutral">, { background: string; borderColor: string; color: string }> = {
  positive: { background: "#e8f5ee", borderColor: "#b7dfc8", color: "#1b4332" },
  negative: { background: "#fdf0f0", borderColor: "#f5c0c0", color: "#7c1d1d" },
}

export default function AmenityPill({ emoji, label, tone = "neutral" }: AmenityPillProps) {
  const toneStyle = tone !== "neutral" ? TONE_STYLES[tone] : undefined
  const hoverClass = tone === "negative" ? "hover-lift-red" : "hover-lift-green"

  return (
    <div
      className={`amenity-pill ${hoverClass}`}
      style={toneStyle ? { background: toneStyle.background, borderColor: toneStyle.borderColor } : undefined}
    >
      {emoji && <span className="amenity-pill-emoji">{emoji}</span>}
      <span className="amenity-pill-label" style={toneStyle ? { color: toneStyle.color } : undefined}>
        {label}
      </span>
    </div>
  )
}
