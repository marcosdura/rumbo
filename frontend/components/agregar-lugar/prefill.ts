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

// Paso del formulario al que se salta: el que viene después de elegir el
// lugar (y el sector, para una vía).
export const PREFILL_STEP: Record<PrefillKind, number> = {
  ruta: 3, sector: 3, via: 4, surf: 3, kayak: 3,
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
