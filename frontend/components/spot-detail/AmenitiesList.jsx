"use client"

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
  {
    id: "alojamiento",
    label: "Alojamiento",
    emoji: "🛏️",
    names: ["Cama incluida", "Ropa de cama", "Baño privado", "Calefacción", "Aire acondicionado"],
  },
  {
    id: "comidas-glamp",
    label: "Comidas & cocina",
    emoji: "🍽️",
    names: ["Desayuno incluido", "Cocina equipada", "Parrilla privada"],
  },
  {
    id: "experiencia",
    label: "Experiencia glamping",
    emoji: "🌿",
    names: ["Terraza / deck", "Vista panorámica", "Fogón privado", "Bañera / jacuzzi", "Zona de descanso exterior"],
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
  "Cama incluida":              "🛏️",
  "Ropa de cama":               "🛌",
  "Baño privado":               "🚿",
  "Calefacción":                "🌡️",
  "Aire acondicionado":         "❄️",
  "Desayuno incluido":          "🥐",
  "Cocina equipada":            "🍳",
  "Parrilla privada":           "🔥",
  "Terraza / deck":             "🌅",
  "Vista panorámica":           "🏔️",
  "Fogón privado":              "🔥",
  "Bañera / jacuzzi":           "🛁",
  "Zona de descanso exterior":  "🌿",
}

function AmenityPill({ amenity }) {
  return (
    <div className="amenity-pill">
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
    <>
      <style>{`
        .amenity-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 12px;
          border-radius: 999px;
          background: #f7f5f0;
          border: 1px solid #e0ddd6;
          font-family: 'DM Sans', sans-serif;
          transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
          cursor: default;
          user-select: none;
        }
        @media (hover: hover) {
          .amenity-pill:hover {
            background: #eeeae2;
            border-color: #ccc8bf;
            transform: scale(1.08);
          }
        }
        .amenity-cat-label {
          font-size: 13px;
          font-weight: 600;
          color: #6b6860;
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        @media (max-width: 480px) {
          .amenity-pill { padding: 5px 10px; }
          .amenity-pill span:last-child { font-size: 12px; }
          .amenity-cat-label { font-size: 12px; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {categorized.map((cat) => (
          <div key={cat.id}>
            <p className="amenity-cat-label">{cat.label}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {cat.items.map((amenity) => (
                <AmenityPill key={amenity.id} amenity={amenity} />
              ))}
            </div>
          </div>
        ))}

        {uncategorized.length > 0 && (
          <div>
            <p className="amenity-cat-label">✨ Otros</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {uncategorized.map((amenity) => (
                <AmenityPill key={amenity.id} amenity={amenity} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default AmenitiesList
