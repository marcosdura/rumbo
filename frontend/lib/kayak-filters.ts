export const KAYAK_FILTERS = {
  waterType: {
    label: "Tipo de agua",
    options: [
      { value: "rio",  label: "Río" },
      { value: "lago", label: "Lago" },
      { value: "mar",  label: "Mar" },
    ],
  },
  difficulty: {
    label: "Dificultad",
    options: [
      { value: "facil",       label: "Fácil" },
      { value: "intermedio",  label: "Intermedio" },
      { value: "dificil",     label: "Difícil" },
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
} as const

export type WaterTypeValue  = typeof KAYAK_FILTERS.waterType.options[number]["value"]
export type KayakDiffValue  = typeof KAYAK_FILTERS.difficulty.options[number]["value"]
export type KayakDurValue   = typeof KAYAK_FILTERS.duration.options[number]["value"]

export interface KayakFilterState {
  waterTypes:      string[]
  difficulties:    string[]
  durations:       string[]
  rentalAvailable: boolean
}

export const EMPTY_KAYAK_FILTERS: KayakFilterState = {
  waterTypes:      [],
  difficulties:    [],
  durations:       [],
  rentalAvailable: false,
}

export function countActiveKayakFilters(f: KayakFilterState): number {
  return (
    f.waterTypes.length +
    f.difficulties.length +
    f.durations.length +
    (f.rentalAvailable ? 1 : 0)
  )
}
