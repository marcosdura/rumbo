"use client"

const AMENITIES = [
  { key: "bathrooms",     label: "Baños",            emoji: "🚽" },
  { key: "potable_water", label: "Agua potable",      emoji: "🚰" },
  { key: "pet_friendly",  label: "Pet friendly",      emoji: "🐶" },
  { key: "kids_friendly", label: "Apto niños",        emoji: "👶" },
  { key: "camping",       label: "Camping",           emoji: "⛺" },
  { key: "parking",       label: "Estacionamiento",   emoji: "🚗" },
  { key: "fire_pits",     label: "Fogones",           emoji: "🔥" },
  { key: "shelter",       label: "Refugio",           emoji: "🏠" },
  { key: "accessible",    label: "Accesible",         emoji: "♿" },
  { key: "signal",        label: "Señal móvil",       emoji: "📱" },
]

export default function TrekkingAmenitiesCard({ trekkingDetail }) {
  if (!trekkingDetail) return null

  const badges = AMENITIES.filter(a => trekkingDetail[a.key] !== null && trekkingDetail[a.key] !== undefined)
  if (badges.length === 0) return null

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e0ddd6",
      borderRadius: 20,
      padding: "24px 28px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
          Características del lugar
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {badges.map(({ key, label, emoji }) => {
          const val = trekkingDetail[key]
          const style = val
            ? { color: "#1b4332", bg: "#e8f5ee", border: "#b7dfc8" }
            : { color: "#7c1d1d", bg: "#fdf0f0", border: "#f5c0c0" }
          return (
            <span key={key} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 999,
              fontSize: 12, fontWeight: 600,
              color: style.color, background: style.bg, border: `1px solid ${style.border}`,
            }}>
              {emoji} {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
