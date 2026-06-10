export const SURF_FILTERS = {
  classType: {
    label: "Tipo de clase",
    options: [
      { value: "grupal",    label: "Grupal" },
      { value: "privada",   label: "Privada" },
      { value: "intensivo", label: "Intensivo" },
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

export type ClassTypeValue = typeof SURF_FILTERS.classType.options[number]["value"]
export type SurfDurValue   = typeof SURF_FILTERS.duration.options[number]["value"]

export interface SurfFilterState {
  classTypes:        ClassTypeValue[]
  durations:         SurfDurValue[]
  equipmentIncluded: boolean
  hasSurfSchool:     boolean
}

export const EMPTY_SURF_FILTERS: SurfFilterState = {
  classTypes:        [],
  durations:         [],
  equipmentIncluded: false,
  hasSurfSchool:     false,
}

export function countActiveSurfFilters(f: SurfFilterState): number {
  return (
    f.classTypes.length +
    f.durations.length +
    (f.equipmentIncluded ? 1 : 0) +
    (f.hasSurfSchool ? 1 : 0)
  )
}
