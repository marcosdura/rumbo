// Escuelas de surf y servicios de kayak: son lugares (categoría Surf / Kayak)
// con sus datos propios en surf_detail / kayak_service_detail. Una playa o
// laguna es un lugar de Surf / Kayak sin esos datos.
import { LANGUAGES, SURF_LEVELS, listLabel, yesNo } from "./operatorInfo"

export type SurfDetail = {
  class_type: string | null
  duration: number | null
  equipment_include: boolean | null
  levels: string[] | null
  languages: string[] | null
  price_note: string | null
  operates_at: string | null
}

export type KayakServiceDetail = {
  water_type: string | null
  difficulty: string | null
  duration: number | null
  kayak_type: string | null
  rental_available: boolean | null
  includes_guide: boolean | null
  includes_life_jacket: boolean | null
  price_note: string | null
  operates_at: string | null
}

export type ServiceSpot = {
  surf_detail?: SurfDetail | null
  kayak_service_detail?: KayakServiceDetail | null
}

export type ServiceRow = { label: string; value: string; pill?: "green" | "yellow" | "red" }

export const CLASS_TYPES: Record<string, string> = { grupal: "👥 Grupal", privada: "🧑 Privada", intensivo: "🔥 Intensivo" }
export const WATER_TYPES: Record<string, string> = { rio: "🏞️ Río", lago: "🌊 Lago", mar: "🌊 Mar" }
export const KAYAK_TYPES: Record<string, string> = { travesia: "Travesía", recreativo: "Recreativo", rapido: "Aguas Rápidas" }
const DIFFICULTIES: Record<string, { label: string; pill: ServiceRow["pill"] }> = {
  facil: { label: "Fácil", pill: "green" },
  intermedio: { label: "Intermedio", pill: "yellow" },
  dificil: { label: "Difícil", pill: "red" },
}

// "1 hora", "1,5 horas".
export function hoursLabel(hours: number): string {
  return `⏱️ ${hours.toLocaleString("es-UY")} ${hours === 1 ? "hora" : "horas"}`
}

const row = (label: string, value: string | null | undefined, pill?: ServiceRow["pill"]): ServiceRow | null =>
  value ? { label, value, ...(pill ? { pill } : {}) } : null
const only = (list: (ServiceRow | null)[]) => list.filter((r): r is ServiceRow => r !== null)

// Lo que se sabe de la escuela ("no sé" no aparece). El precio, la temporada
// y el contacto son los del lugar y se muestran con el resto.
export function surfRows(d: SurfDetail): ServiceRow[] {
  return only([
    row("Dónde opera", d.operates_at?.trim() ? `📍 ${d.operates_at.trim()}` : null),
    row("Tipo de clase", d.class_type ? CLASS_TYPES[d.class_type] ?? d.class_type : null),
    row("Duración", d.duration != null ? hoursLabel(d.duration) : null),
    row("Equipo", d.equipment_include == null ? null : `🩳 ${d.equipment_include ? "Incluido" : "No incluido"}`),
    row("Niveles", listLabel(d.levels, SURF_LEVELS)),
    row("Idiomas", listLabel(d.languages, LANGUAGES)),
  ])
}

export function kayakRows(d: KayakServiceDetail): ServiceRow[] {
  const difficulty = d.difficulty ? DIFFICULTIES[d.difficulty] : undefined
  return only([
    row("Dónde opera", d.operates_at?.trim() ? `📍 ${d.operates_at.trim()}` : null),
    row("Tipo de agua", d.water_type ? WATER_TYPES[d.water_type] ?? d.water_type : null),
    difficulty ? row("Dificultad", difficulty.label, difficulty.pill) : null,
    row("Duración", d.duration != null ? hoursLabel(d.duration) : null),
    row("Tipo de kayak", d.kayak_type ? `🛶 ${KAYAK_TYPES[d.kayak_type] ?? d.kayak_type}` : null),
    row("Alquiler", d.rental_available == null ? null : `🏪 ${d.rental_available ? "Disponible" : "No disponible"}`),
    row("🧭 Guía", yesNo(d.includes_guide)),
    row("🦺 Chaleco salvavidas", yesNo(d.includes_life_jacket)),
  ])
}

// La aclaración del precio de una escuela o servicio ("por clase"), o null
// si el lugar no es uno (o no la tiene).
export function servicePriceNote(spot: ServiceSpot): string | null | undefined {
  const detail = spot.surf_detail ?? spot.kayak_service_detail
  return detail ? detail.price_note?.trim() || "" : undefined
}
