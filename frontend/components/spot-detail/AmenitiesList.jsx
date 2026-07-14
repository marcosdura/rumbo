"use client"

import AmenityPill from "./AmenityPill"

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
        .amenity-cat-label {
          font-size: 13px;
          font-weight: 600;
          color: #6b6860;
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        @media (max-width: 480px) {
          .amenity-cat-label { font-size: 12px; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {categorized.map((cat) => (
          <div key={cat.id}>
            <p className="amenity-cat-label">{cat.label}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {cat.items.map((amenity) => (
                <AmenityPill key={amenity.id} emoji={AMENITY_ICONS[amenity.name] || "✨"} label={amenity.name} />
              ))}
            </div>
          </div>
        ))}

        {uncategorized.length > 0 && (
          <div>
            <p className="amenity-cat-label">✨ Otros</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {uncategorized.map((amenity) => (
                <AmenityPill key={amenity.id} emoji="✨" label={amenity.name} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default AmenitiesList
