// Los filtros de /search viven en la URL, con los mismos nombres que usa el
// backend (GET /spots): así sobreviven a recargar y a volver atrás, se
// pueden compartir, y la URL es lo único que hay que leer. Este módulo
// traduce entre la URL y el estado de cada panel de filtros, y arma los
// chips de lo aplicado.
import { TREKKING_FILTERS, EMPTY_TREKKING_FILTERS, type TrekkingFilterState } from "./trekking-filters"
import { KAYAK_FILTERS, EMPTY_KAYAK_FILTERS, type KayakFilterState } from "./kayak-filters"
import { SURF_FILTERS, EMPTY_SURF_FILTERS, type SurfFilterState } from "./surf-filters"
import { CLIMBING_FILTERS, EMPTY_CLIMBING_FILTERS, type ClimbingFilterState } from "./climbing-filters"
import { CAMPING_AMENITY_GROUPS, CAMPING_PRICE_RANGES, EMPTY_CAMPING_FILTERS, type CampingFilterState } from "./camping-filters"
import {
  EMPTY_GLAMPING_FILTERS, EMPTY_MOTORHOME_FILTERS, GLAMPING_AMENITIES, GLAMPING_PRICE_RANGES, MOTORHOME_SERVICES,
  type GlampingFilterState, type MotorhomeFilterState,
} from "./stay-filters"

type Codec<T> = {
  keys: string[]
  fromParams: (p: URLSearchParams) => T
  toParams: (state: T, p: URLSearchParams) => void
  count: (state: T) => number
}

const all = (p: URLSearchParams, key: string) => p.getAll(key)
const flag = (p: URLSearchParams, key: string) => p.get(key) === "true"
const setFlag = (p: URLSearchParams, key: string, on: boolean) => { if (on) p.append(key, "true") }
const appendAll = (p: URLSearchParams, key: string, values: readonly (string | number)[]) => values.forEach(v => p.append(key, String(v)))

const TREKKING_AMENITY_KEYS = TREKKING_FILTERS.amenities.map(a => a.key) as string[]

export const TREKKING_CODEC: Codec<TrekkingFilterState> = {
  keys: ["difficulty", "duration", "distance", ...TREKKING_AMENITY_KEYS],
  fromParams: p => ({
    difficulties: all(p, "difficulty") as TrekkingFilterState["difficulties"],
    durations: all(p, "duration") as TrekkingFilterState["durations"],
    distances: all(p, "distance") as TrekkingFilterState["distances"],
    amenities: Object.fromEntries(TREKKING_AMENITY_KEYS.filter(k => flag(p, k)).map(k => [k, true])),
  }),
  toParams: (s, p) => {
    appendAll(p, "difficulty", s.difficulties)
    appendAll(p, "duration", s.durations)
    appendAll(p, "distance", s.distances)
    Object.entries(s.amenities).forEach(([k, v]) => setFlag(p, k, !!v))
  },
  count: s => s.difficulties.length + s.durations.length + s.distances.length + Object.values(s.amenities).filter(Boolean).length,
}

export const KAYAK_CODEC: Codec<KayakFilterState> = {
  keys: ["water_type", "kayak_difficulty", "kayak_duration", "rental_available"],
  fromParams: p => ({
    waterTypes: all(p, "water_type"), difficulties: all(p, "kayak_difficulty"),
    durations: all(p, "kayak_duration"), rentalAvailable: flag(p, "rental_available"),
  }),
  toParams: (s, p) => {
    appendAll(p, "water_type", s.waterTypes)
    appendAll(p, "kayak_difficulty", s.difficulties)
    appendAll(p, "kayak_duration", s.durations)
    setFlag(p, "rental_available", s.rentalAvailable)
  },
  count: s => s.waterTypes.length + s.difficulties.length + s.durations.length + (s.rentalAvailable ? 1 : 0),
}

export const SURF_CODEC: Codec<SurfFilterState> = {
  keys: ["class_type", "surf_duration", "equipment_included", "has_surf_school"],
  fromParams: p => ({
    classTypes: all(p, "class_type") as SurfFilterState["classTypes"],
    durations: all(p, "surf_duration") as SurfFilterState["durations"],
    equipmentIncluded: flag(p, "equipment_included"), hasSurfSchool: flag(p, "has_surf_school"),
  }),
  toParams: (s, p) => {
    appendAll(p, "class_type", s.classTypes)
    appendAll(p, "surf_duration", s.durations)
    setFlag(p, "equipment_included", s.equipmentIncluded)
    setFlag(p, "has_surf_school", s.hasSurfSchool)
  },
  count: s => s.classTypes.length + s.durations.length + (s.equipmentIncluded ? 1 : 0) + (s.hasSurfSchool ? 1 : 0),
}

export const CLIMBING_CODEC: Codec<ClimbingFilterState> = {
  keys: ["climbing_type", "grade_range", "no_restrictions"],
  fromParams: p => ({
    types: all(p, "climbing_type") as ClimbingFilterState["types"],
    gradeRanges: all(p, "grade_range") as ClimbingFilterState["gradeRanges"],
    hasRestrictions: flag(p, "no_restrictions"),
  }),
  toParams: (s, p) => {
    appendAll(p, "climbing_type", s.types)
    appendAll(p, "grade_range", s.gradeRanges)
    setFlag(p, "no_restrictions", s.hasRestrictions)
  },
  count: s => s.types.length + s.gradeRanges.length + (s.hasRestrictions ? 1 : 0),
}

export const CAMPING_CODEC: Codec<CampingFilterState> = {
  keys: ["amenity_ids", "price_range"],
  fromParams: p => ({
    amenityIds: all(p, "amenity_ids").map(Number).filter(n => Number.isInteger(n)),
    priceRanges: all(p, "price_range") as CampingFilterState["priceRanges"],
  }),
  toParams: (s, p) => {
    appendAll(p, "amenity_ids", s.amenityIds)
    appendAll(p, "price_range", s.priceRanges)
  },
  count: s => s.amenityIds.length + s.priceRanges.length,
}

export const GLAMPING_CODEC: Codec<GlampingFilterState> = {
  keys: ["glamping_price", "glamping_amenity"],
  fromParams: p => ({ priceRanges: all(p, "glamping_price"), amenities: all(p, "glamping_amenity") }),
  toParams: (s, p) => {
    appendAll(p, "glamping_price", s.priceRanges)
    appendAll(p, "glamping_amenity", s.amenities)
  },
  count: s => s.priceRanges.length + s.amenities.length,
}

export const MOTORHOME_CODEC: Codec<MotorhomeFilterState> = {
  keys: ["motorhome_service"],
  fromParams: p => ({ services: all(p, "motorhome_service") }),
  toParams: (s, p) => appendAll(p, "motorhome_service", s.services),
  count: s => s.services.length,
}

export const CODECS = {
  Trekking: TREKKING_CODEC, Kayak: KAYAK_CODEC, Surf: SURF_CODEC, Escalada: CLIMBING_CODEC, Camping: CAMPING_CODEC,
  Glamping: GLAMPING_CODEC, Motorhome: MOTORHOME_CODEC,
} as const

export type FilterActivity = keyof typeof CODECS

export const EMPTY_FILTERS = {
  Trekking: EMPTY_TREKKING_FILTERS, Kayak: EMPTY_KAYAK_FILTERS, Surf: EMPTY_SURF_FILTERS,
  Escalada: EMPTY_CLIMBING_FILTERS, Camping: EMPTY_CAMPING_FILTERS,
  Glamping: EMPTY_GLAMPING_FILTERS, Motorhome: EMPTY_MOTORHOME_FILTERS,
}

export function hasFilterPanel(activity: string): activity is FilterActivity {
  return activity in CODECS
}

// ─── Información práctica: para cualquier búsqueda ───────────────────────

export const PRACTICAL_FILTERS = [
  { param: "pet_friendly", value: "true", label: "🐶 Acepta mascotas" },
  { param: "reservation_required", value: "false", label: "📅 Sin reserva" },
  { param: "cell_signal", value: "true", label: "📶 Con señal" },
] as const

export function isPracticalOn(p: URLSearchParams, param: string): boolean {
  const f = PRACTICAL_FILTERS.find(f => f.param === param)
  return !!f && p.get(param) === f.value
}

// ─── Orden ───────────────────────────────────────────────────────────────

export const SORT_OPTIONS = [
  { value: "recommended", label: "Recomendados" },
  { value: "rating", label: "Mejor calificados" },
  { value: "name", label: "Nombre (A–Z)" },
] as const

export const DEFAULT_SORT = "recommended"

export function sortOf(p: URLSearchParams): string {
  const sort = p.get("sort")
  return SORT_OPTIONS.some(o => o.value === sort) ? sort! : DEFAULT_SORT
}

// ─── Cambios a la URL ────────────────────────────────────────────────────

const BASE_KEYS = ["activity", "department", "sort", ...PRACTICAL_FILTERS.map(f => f.param)]

// Reemplaza los filtros del panel de la actividad por los nuevos.
export function withPanelFilters<A extends FilterActivity>(p: URLSearchParams, activity: A, state: Parameters<typeof CODECS[A]["toParams"]>[0]): URLSearchParams {
  const next = new URLSearchParams()
  for (const [k, v] of p) if (BASE_KEYS.includes(k)) next.append(k, v)
  ;(CODECS[activity].toParams as (s: typeof state, p: URLSearchParams) => void)(state, next)
  return next
}

export function withPractical(p: URLSearchParams, param: string, on: boolean): URLSearchParams {
  const next = new URLSearchParams(p)
  next.delete(param)
  const f = PRACTICAL_FILTERS.find(f => f.param === param)
  if (on && f) next.append(param, f.value)
  return next
}

export function withSort(p: URLSearchParams, sort: string): URLSearchParams {
  const next = new URLSearchParams(p)
  next.delete("sort")
  if (sort !== DEFAULT_SORT) next.set("sort", sort)
  return next
}

// Sin los filtros (quedan actividad, departamento y orden).
export function withoutFilters(p: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams()
  for (const key of ["activity", "department", "sort"]) {
    const v = p.get(key)
    if (v) next.set(key, v)
  }
  return next
}

// Sacar la actividad saca también sus filtros (no aplican a otra).
export function withoutActivity(p: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams()
  for (const [k, v] of p) if (k !== "activity" && BASE_KEYS.includes(k)) next.append(k, v)
  return next
}

export function withoutPair(p: URLSearchParams, key: string, value: string): URLSearchParams {
  const next = new URLSearchParams()
  for (const [k, v] of p) if (!(k === key && v === value)) next.append(k, v)
  return next
}

// ─── Chips de lo aplicado ────────────────────────────────────────────────

const optionLabels = (config: Record<string, { options?: readonly { value: string; label: string }[] }>) =>
  Object.fromEntries(Object.values(config).flatMap(c => c.options ?? []).map(o => [o.value, o.label]))

const LABELS: Record<string, Record<string, string>> = {
  difficulty: optionLabels({ d: TREKKING_FILTERS.difficulty }),
  duration: optionLabels({ d: TREKKING_FILTERS.duration }),
  distance: Object.fromEntries(TREKKING_FILTERS.distance.options.map(o => [o.value, `Distancia ${o.label.toLowerCase()}`])),
  water_type: optionLabels({ d: KAYAK_FILTERS.waterType }),
  kayak_difficulty: optionLabels({ d: KAYAK_FILTERS.difficulty }),
  kayak_duration: optionLabels({ d: KAYAK_FILTERS.duration }),
  class_type: optionLabels({ d: SURF_FILTERS.classType }),
  surf_duration: optionLabels({ d: SURF_FILTERS.duration }),
  climbing_type: optionLabels({ d: CLIMBING_FILTERS.type }),
  grade_range: optionLabels({ d: CLIMBING_FILTERS.gradeRange }),
  price_range: Object.fromEntries(CAMPING_PRICE_RANGES.map(o => [o.value, `Precio: ${o.label}`])),
  glamping_price: Object.fromEntries(GLAMPING_PRICE_RANGES.map(o => [o.value, `Precio: ${o.label}`])),
  glamping_amenity: Object.fromEntries(GLAMPING_AMENITIES.map(o => [o.value, `${o.emoji} ${o.label}`])),
  motorhome_service: Object.fromEntries(MOTORHOME_SERVICES.map(o => [o.value, `${o.emoji} ${o.label}`])),
  amenity_ids: Object.fromEntries(
    CAMPING_AMENITY_GROUPS.flatMap(g => g.amenities as readonly { id: number; label: string }[]).map(a => [String(a.id), a.label]),
  ),
}

const FLAG_LABELS: Record<string, string> = {
  ...Object.fromEntries(TREKKING_FILTERS.amenities.map(a => [a.key, `${a.emoji} ${a.label}`])),
  rental_available: "Alquiler disponible",
  equipment_included: "Equipo incluido",
  has_surf_school: "Con escuela de surf",
  no_restrictions: "Sin restricciones",
}

export type FilterChip = { key: string; value: string; label: string }

// Los filtros aplicados (sin actividad, departamento ni orden), como chips.
export function filterChips(p: URLSearchParams): FilterChip[] {
  const chips: FilterChip[] = []
  for (const [key, value] of p) {
    if (key === "activity" || key === "department" || key === "sort") continue
    const practical = PRACTICAL_FILTERS.find(f => f.param === key && f.value === value)
    const label = practical?.label ?? LABELS[key]?.[value] ?? (value === "true" ? FLAG_LABELS[key] : undefined)
    if (label) chips.push({ key, value, label })
  }
  return chips
}
