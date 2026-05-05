function AmenitiesList({ amenities }) {
  const amenityIcons = {
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

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
      {amenities.map((amenity) => (
        <div
          key={amenity.id}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "6px 12px",
            borderRadius: 999,
            background: "#f7f5f0",
            border: "1px solid #e0ddd6",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>
            {amenityIcons[amenity.name] || "✨"}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#3d3d3a" }}>
            {amenity.name}
          </span>
        </div>
      ))}
    </div>
  )
}

export default AmenitiesList