function AmenitiesList({ amenities }) {
  const amenityIcons = {
    "Ducha": "🚿",
    "Agua caliente": "🔥",
    "Baños": "🚽",
    "Agua potable": "🚰",
    "Electricidad": "⚡",
    "Lavadero": "🧼",
    "Parrillero": "🔥",
    "Cocina compartida": "🍳",
    "Comedor": "🍽️",
    "Heladera": "🧊",
    "Leña disponible": "🪵",
    "Sombra": "🌳",
    "Mesas y bancos": "🪑",
    "Parcelas delimitadas": "⛺",
    "Acceso a río/lago/mar": "🌊",
    "Playa": "🏖️",
    "Cancha de fútbol": "⚽",
    "Cancha de Voley": "🏐",
    "Piscina": "🏊",
    "Alquiler de bicis": "🚴",
    "Kayak": "🛶",
    "WiFi": "🛜",
    "Acepta mascotas": "🐶",
    "Proveeduría/kiosco": "🛒",
    "Cafetería": "☕",
    "Restaurante/bar": "🍺",
    "Estacionamiento": "🚗",
    "Seguridad": "🔒",
    "Zona para fogón": "🏕️",
    "Tomas para camper/van": "🔌",
    "Área para motorhomes": "🚐",
  }

  return (
    <div className="flex gap-3 flex-wrap pt-2">
      {amenities.map((amenity) => (
        <div key={amenity.id} className="amenity-badge">
          <span className="text-lg">
            {amenityIcons[amenity.name] || "✨"}
          </span>
          <span className="text-sm text-gray-700 font-medium">
            {amenity.name}
          </span>
        </div>
      ))}
    </div>
  )
}

export default AmenitiesList