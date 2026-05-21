import { useState } from "react"

const CATEGORIES = [
  {
    id: "esenciales",
    label: "Esenciales",
    emoji: "⚡",
    names: ["Ducha", "Agua caliente", "Baños", "Agua potable", "Electricidad", "Tomas para camper/van", "Área para motorhomes"],
  },
  {
    id: "cocina",
    label: "Cocina & comida",
    emoji: "🍽️",
    names: ["Cocina compartida", "Heladera", "Comedor", "Parrillero", "Leña disponible", "Proveeduría/kiosco", "Cafetería", "Restaurante/bar"],
  },
  {
    id: "actividades",
    label: "Actividades & diversión",
    emoji: "🏄",
    names: ["Acceso a río/lago/mar", "Playa", "Piscina", "Cancha de fútbol", "Cancha de Voley", "Alquiler de bicis", "Kayak"],
  },
  {
    id: "comodidades",
    label: "Comodidades del sitio",
    emoji: "🏕️",
    names: ["Parcelas delimitadas", "Mesas y bancos", "Zona para fogón", "Sombra", "Lavadero"],
  },
  {
    id: "extras",
    label: "Extras & servicios",
    emoji: "🔧",
    names: ["WiFi", "Seguridad", "Estacionamiento", "Acepta mascotas"],
  },
]

const AMENITY_ICONS = {
  "Ducha":                "🚿",
  "Agua caliente":        "🔥",
  "Baños":                "🚽",
  "Agua potable":         "🚰",
  "Electricidad":         "⚡",
  "Lavadero":             "🧼",
  "Parrillero":           "🔥",
  "Cocina compartida":    "🍳",
  "Comedor":              "🍽️",
  "Heladera":             "🧊",
  "Leña disponible":      "🪵",
  "Sombra":               "🌳",
  "Mesas y bancos":       "🪑",
  "Parcelas delimitadas": "⛺",
  "Acceso a río/lago/mar":"🌊",
  "Playa":                "🏖️",
  "Cancha de fútbol":     "⚽",
  "Cancha de Voley":      "🏐",
  "Piscina":              "🏊",
  "Alquiler de bicis":    "🚴",
  "Kayak":                "🛶",
  "WiFi":                 "🛜",
  "Acepta mascotas":      "🐶",
  "Proveeduría/kiosco":   "🛒",
  "Cafetería":            "☕",
  "Restaurante/bar":      "🍺",
  "Estacionamiento":      "🚗",
  "Seguridad":            "🔒",
  "Zona para fogón":      "🏕️",
  "Tomas para camper/van":"🔌",
  "Área para motorhomes": "🚐",
}

function AmenityPill({ amenity }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "6px 12px",
        borderRadius: 999,
        background: hovered ? "#eeeae2" : "#f7f5f0",
        border: `1px solid ${hovered ? "#ccc8bf" : "#e0ddd6"}`,
        fontFamily: "'DM Sans', sans-serif",
        transform: hovered ? "scale(1.08)" : "scale(1)",
        transition: "transform 0.15s ease, background 0.15s ease, border-color 0.15s ease",
        cursor: "default",
        userSelect: "none",
      }}
    >
      <span style={{ fontSize: 15, lineHeight: 1 }}>
        {AMENITY_ICONS[amenity.name] || "✨"}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: "#3d3d3a" }}>
        {amenity.name}
      </span>
    </div>
  )
}

function AmenitiesList({ amenities }) {
  const categorized = CATEGORIES.map((cat) => ({
    ...cat,
    items: amenities.filter((a) => cat.names.includes(a.name)),
  })).filter((cat) => cat.items.length > 0)

  const uncategorized = amenities.filter(
    (a) => !CATEGORIES.some((cat) => cat.names.includes(a.name))
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {categorized.map((cat) => (
        <div key={cat.id}>
          <p style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#6b6860",
            marginBottom: 8,
            marginTop: 0,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
             {cat.label}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {cat.items.map((amenity) => (
              <AmenityPill key={amenity.id} amenity={amenity} />
            ))}
          </div>
        </div>
      ))}

      {uncategorized.length > 0 && (
        <div>
          <p style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#6b6860",
            marginBottom: 8,
            marginTop: 0,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            ✨ Otros
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {uncategorized.map((amenity) => (
              <AmenityPill key={amenity.id} amenity={amenity} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AmenitiesList