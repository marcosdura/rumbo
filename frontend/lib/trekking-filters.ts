export const TREKKING_FILTERS = {
  difficulty: {
    label: "Dificultad",
    options: [
      { value: "fácil",    label: "Fácil" },
      { value: "moderado", label: "Moderado" },
      { value: "difícil",  label: "Difícil" },
    ],
  },
  duration: {
    label: "Duración",
    options: [
      { value: "corta", label: "Corta (< 2h)" },
      { value: "media", label: "Media (2-5h)" },
      { value: "larga", label: "Larga (+ 5h)" },
    ],
  },
  amenities: [
    { key: "parking",        label: "Estacionamiento", emoji: "🅿️" },
    { key: "potable_water",  label: "Agua potable",     emoji: "💧" },
    { key: "pet_friendly",   label: "Pet friendly",     emoji: "🐾" },
    { key: "kids_friendly",  label: "Apto niños",       emoji: "👶" },
    { key: "bathrooms",      label: "Baños",            emoji: "🚿" },
    { key: "camping_amenity",label: "Fogones",          emoji: "🔥" },
  ],
} as const

export type DifficultyValue = typeof TREKKING_FILTERS.difficulty.options[number]["value"]
export type DurationValue   = typeof TREKKING_FILTERS.duration.options[number]["value"]
export type AmenityKey      = typeof TREKKING_FILTERS.amenities[number]["key"]
