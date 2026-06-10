export const CLIMBING_FILTERS = {
  type: {
    label: "Tipo de escalada",
    options: [
      { value: "deportiva", label: "Deportiva" },
      { value: "trad",      label: "Trad" },
      { value: "boulder",   label: "Boulder" },
      { value: "mixta",     label: "Mixta" },
    ],
  },
  gradeRange: {
    label: "Nivel de grados",
    options: [
      { value: "principiante", label: "Principiante (≤ 5c)" },
      { value: "intermedio",   label: "Intermedio (6a–6c)" },
      { value: "avanzado",     label: "Avanzado (7a–7c)" },
      { value: "experto",      label: "Experto (8a+)" },
    ],
  },
} as const

export type ClimbingTypeValue  = typeof CLIMBING_FILTERS.type.options[number]["value"]
export type GradeRangeValue    = typeof CLIMBING_FILTERS.gradeRange.options[number]["value"]

export interface ClimbingFilterState {
  types:           ClimbingTypeValue[]
  gradeRanges:     GradeRangeValue[]
  hasRestrictions: boolean
}

export const EMPTY_CLIMBING_FILTERS: ClimbingFilterState = {
  types:           [],
  gradeRanges:     [],
  hasRestrictions: false,
}

export function countActiveClimbingFilters(f: ClimbingFilterState): number {
  return (
    f.types.length +
    f.gradeRanges.length +
    (f.hasRestrictions ? 1 : 0)
  )
}
