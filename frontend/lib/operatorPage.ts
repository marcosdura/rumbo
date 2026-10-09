// Lo que muestran las páginas de una escuela de surf o un servicio de kayak
// (components/operator-page/OperatorPage.tsx): las filas de "Información",
// solo con lo que se sabe. null = "no sé" (quien lo cargó no lo sabía).
import { LANGUAGES, SURF_LEVELS, listLabel, yesNo } from "./operatorInfo"
import type { PublicKayak, PublicSurfSchool } from "./types"

export type InfoRow = {
  label: string
  value: string
  // Dificultad del kayak: se muestra como pill de color.
  pill?: "green" | "yellow" | "red"
}

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"]

// "Noviembre – Marzo". Sin los dos meses no se sabe: null (antes decía
// "Todo el año", que es afirmar algo que nadie cargó).
export function operatorSeason(start: number | null, end: number | null): string | null {
  if (!start || !end) return null
  return `${MONTHS[start - 1]} – ${MONTHS[end - 1]}`
}

// "1 hora", "1,5 horas" (antes "1.5 horas").
export function durationLabel(hours: number): string {
  return `⏱️ ${hours.toLocaleString("es-UY")} ${hours === 1 ? "hora" : "horas"}`
}

function rows(list: (InfoRow | null)[]): InfoRow[] {
  return list.filter((r): r is InfoRow => r !== null)
}

const row = (label: string, value: string | null | undefined, pill?: InfoRow["pill"]): InfoRow | null =>
  value ? { label, value, ...(pill ? { pill } : {}) } : null

const CLASS_TYPES: Record<string, string> = {
  grupal: "👥 Grupal",
  privada: "🧑 Privada",
  intensivo: "🔥 Intensivo",
}

export function surfInfoRows(s: PublicSurfSchool): InfoRow[] {
  return rows([
    row("Tipo de clase", s.class_type ? CLASS_TYPES[s.class_type] ?? s.class_type : null),
    row("Duración", s.duration != null ? durationLabel(s.duration) : null),
    row("Equipo", s.equipment_include == null ? null : `🩳 ${s.equipment_include ? "Incluido" : "No incluido"}`),
    row("Niveles", listLabel(s.levels, SURF_LEVELS)),
    row("Idiomas", listLabel(s.languages, LANGUAGES)),
    row("Temporada", operatorSeason(s.season_start, s.season_end)),
  ])
}

const WATER_TYPES: Record<string, string> = { rio: "🏞️ Río", lago: "🌊 Lago", mar: "🌊 Mar" }
const DIFFICULTIES: Record<string, { label: string; pill: InfoRow["pill"] }> = {
  facil: { label: "Fácil", pill: "green" },
  intermedio: { label: "Intermedio", pill: "yellow" },
  dificil: { label: "Difícil", pill: "red" },
}
const KAYAK_TYPES: Record<string, string> = { travesia: "Travesía", recreativo: "Recreativo", rapido: "Aguas Rápidas" }

export function kayakInfoRows(k: PublicKayak): InfoRow[] {
  const difficulty = k.difficulty ? DIFFICULTIES[k.difficulty] : undefined
  return rows([
    row("Tipo de agua", k.water_type ? WATER_TYPES[k.water_type] ?? k.water_type : null),
    difficulty ? row("Dificultad", difficulty.label, difficulty.pill) : null,
    row("Duración", k.duration != null ? durationLabel(k.duration) : null),
    row("Tipo de kayak", k.kayak_type ? `🛶 ${KAYAK_TYPES[k.kayak_type] ?? k.kayak_type}` : null),
    row("Alquiler", k.rental_available == null ? null : `🏪 ${k.rental_available ? "Disponible" : "No disponible"}`),
    row("🧭 Guía", yesNo(k.includes_guide)),
    row("🦺 Chaleco salvavidas", yesNo(k.includes_life_jacket)),
    row("Temporada", operatorSeason(k.season_start, k.season_end)),
  ])
}

// "Escuela de surf en Playa Brava, Rocha." (metadatos y JSON-LD).
export function operatorDescription(what: string, op: { spot_name: string | null; spot_department: string | null }): string {
  return op.spot_name ? `${what} en ${op.spot_name}, ${op.spot_department}.` : `${what} en Uruguay.`
}
