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
  distance: {
    label: "Distancia",
    options: [
      { value: "corta", label: "Corta (< 5km)" },
      { value: "media", label: "Media (5-15km)" },
      { value: "larga", label: "Larga (+ 15km)" },
    ],
  },
  amenities: [
    { key: "parking",         label: "Estacionamiento", emoji: "🅿️" },
    { key: "potable_water",   label: "Agua potable",     emoji: "💧" },
    { key: "pet_friendly",    label: "Pet friendly",     emoji: "🐾" },
    { key: "kids_friendly",   label: "Apto niños",       emoji: "👶" },
    { key: "bathrooms",       label: "Baños",            emoji: "🚿" },
    { key: "camping_amenity", label: "Fogones",          emoji: "🔥" },
  ],
} as const

export type DifficultyValue = typeof TREKKING_FILTERS.difficulty.options[number]["value"]
export type DurationValue   = typeof TREKKING_FILTERS.duration.options[number]["value"]
export type DistanceValue   = typeof TREKKING_FILTERS.distance.options[number]["value"]
export type AmenityKey      = typeof TREKKING_FILTERS.amenities[number]["key"]

export interface TrekkingFilterState {
  difficulties: DifficultyValue[]
  durations:    DurationValue[]
  distances:    DistanceValue[]
  amenities:    Partial<Record<AmenityKey, boolean>>
}

export const EMPTY_TREKKING_FILTERS: TrekkingFilterState = {
  difficulties: [],
  durations:    [],
  distances:    [],
  amenities:    {},
}

export function countActiveFilters(f: TrekkingFilterState): number {
  return (
    f.difficulties.length +
    f.durations.length +
    f.distances.length +
    Object.values(f.amenities).filter(Boolean).length
  )
}

export function hasTrekkingFilters(f: TrekkingFilterState): boolean {
  return countActiveFilters(f) > 0
}
