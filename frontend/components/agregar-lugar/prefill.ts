// Links directos a agregar-lugar para sumar algo a un lugar existente:
// /agregar-lugar?sumar=sector&spot=12 abre directo el formulario, sin pasar
// por elegir categoría, modo y lugar. Los arman los botones de la página del
// spot y del dashboard (addToSpotUrl); los lee AgregarLugar (parsePrefill).

export type PrefillKind = "ruta" | "sector" | "via" | "surf" | "kayak"

export type Prefill = { kind: PrefillKind; spotId: number; sectorId: number | null }

const KINDS: PrefillKind[] = ["ruta", "sector", "via", "surf", "kayak"]

// Categoría de agregar-lugar que corresponde a cada cosa.
export const PREFILL_CATEGORY: Record<PrefillKind, string> = {
  ruta: "Trekking", sector: "Escalada", via: "Escalada", surf: "Surf", kayak: "Kayak",
}

// El paso al que se salta está en flow.ts (ENTRY_STEP).

// Encabezado del formulario con link directo: qué se está sumando y dónde.
export function prefillIntro(kind: PrefillKind, spotName: string, sectorName?: string | null): string {
  const what = {
    ruta: `Agregá una ruta a ${spotName}.`,
    sector: `Sugerí un sector de escalada en ${spotName}.`,
    via: `Sugerí vías para el sector ${sectorName ?? ""} de ${spotName}.`,
    surf: `Sumá tu escuela de surf en ${spotName}.`,
    kayak: `Sumá tu servicio de kayak en ${spotName}.`,
  }[kind]
  return `${what} Lo revisamos antes de publicarlo.`
}

// Botón para sumar otra cosa igual en el mismo lugar, al terminar.
export const PREFILL_AGAIN: Record<PrefillKind, string> = {
  ruta: "Agregar otra ruta",
  sector: "Sugerir otro sector",
  via: "Sugerir más vías",
  surf: "Sumar otra escuela",
  kayak: "Sumar otro servicio",
}

function positiveInt(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const n = Number(value)
  return n > 0 ? n : null
}

export function parsePrefill(params: URLSearchParams): Prefill | null {
  const kind = params.get("sumar") as PrefillKind | null
  const spotId = positiveInt(params.get("spot"))
  if (!kind || !KINDS.includes(kind) || !spotId) return null
  const sectorId = positiveInt(params.get("sector"))
  // Una vía va dentro de un sector: sin sector, el link no sirve.
  if (kind === "via" && !sectorId) return null
  return { kind, spotId, sectorId: kind === "via" ? sectorId : null }
}

export function addToSpotUrl(kind: PrefillKind, spotId: number, sectorId?: number): string {
  const params = new URLSearchParams({ sumar: kind, spot: String(spotId) })
  if (kind === "via" && sectorId) params.set("sector", String(sectorId))
  return `/agregar-lugar?${params.toString()}`
}
