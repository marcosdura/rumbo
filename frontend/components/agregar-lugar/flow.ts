// Los pasos de agregar-lugar según lo que se está cargando. Antes cada paso
// tenía un número fijo con desplazamientos a mano (glampingStepOffset, ...),
// y los "Atrás", los "Editar" del resumen y el "Paso X de N" se desfasaban
// en algunos flujos. Ahora cada flujo es una lista de pasos con nombre: el
// siguiente, el anterior y el número salen de la posición en la lista.
import type { ClimbingMode, TrekkingMode } from "./types"
import type { PrefillKind } from "./prefill"

export type StepKey =
  | "categoria"
  | "modo"                      // trekking / escalada: ¿qué querés agregar?
  | "lugar"                     // elegir un lugar existente
  | "sector"                    // elegir un sector existente (vías nuevas)
  | "info"                      // datos del lugar nuevo (o de la playa nueva)
  | "glamping_unidades"
  | "motorhome"
  | "amenities"
  | "experiencias"
  | "trekking_caracteristicas"
  | "rutas"                     // rutas de trekking
  | "sectores"                  // escalada, lugar nuevo: sus sectores
  | "sector_nuevo"              // escalada: un sector para un lugar existente
  | "vias"                      // vías de los sectores nuevos (opcional)
  | "vias_nuevas"               // vías para un sector existente
  | "servicio"                  // escuela de surf / servicio de kayak
  | "imagenes"
  | "adicionales"               // categorías adicionales
  | "resumen"

export type FlowInput = {
  category: string | null
  climbingMode: ClimbingMode
  trekkingMode: TrekkingMode
  creatingNewSpot: boolean
}

export function flowSteps({ category, climbingMode, trekkingMode, creatingNewSpot }: FlowInput): StepKey[] {
  switch (category) {
    case "Camping":
      return ["categoria", "info", "amenities", "experiencias", "imagenes", "adicionales", "resumen"]
    case "Glamping":
      return ["categoria", "info", "glamping_unidades", "amenities", "experiencias", "imagenes", "adicionales", "resumen"]
    case "Motorhome":
      return ["categoria", "info", "motorhome", "experiencias", "imagenes", "adicionales", "resumen"]
    case "Trekking":
      if (trekkingMode === "new_spot") return ["categoria", "modo", "info", "trekking_caracteristicas", "rutas", "imagenes", "resumen"]
      if (trekkingMode === "new_route") return ["categoria", "modo", "lugar", "rutas", "resumen"]
      return ["categoria", "modo"]
    case "Escalada":
      if (climbingMode === "new_spot") return ["categoria", "modo", "info", "sectores", "vias", "imagenes", "resumen"]
      if (climbingMode === "new_sector") return ["categoria", "modo", "lugar", "sector_nuevo", "vias", "resumen"]
      if (climbingMode === "new_route") return ["categoria", "modo", "lugar", "sector", "vias_nuevas", "resumen"]
      return ["categoria", "modo"]
    case "Surf":
    case "Kayak":
      // Playa o laguna nueva: se sugiere junto con la escuela o el servicio.
      return creatingNewSpot
        ? ["categoria", "lugar", "info", "imagenes", "servicio", "resumen"]
        : ["categoria", "lugar", "servicio", "resumen"]
    default:
      return ["categoria"]
  }
}

// Si ya se sabe cuántos pasos tiene el flujo (falta elegir categoría o modo).
export function isComplete(steps: StepKey[]): boolean {
  return steps[steps.length - 1] === "resumen"
}

// Por link directo (?sumar=...) se entra a este paso, y de ahí no se puede
// volver atrás a elegir otra cosa.
export const ENTRY_STEP: Record<PrefillKind, StepKey> = {
  ruta: "rutas", sector: "sector_nuevo", via: "vias_nuevas", surf: "servicio", kayak: "servicio",
}

// Lo que se muestra del flujo: con link directo, desde el paso de entrada.
export function visibleSteps(steps: StepKey[], entry: StepKey | null): StepKey[] {
  if (!entry) return steps
  const i = steps.indexOf(entry)
  return i === -1 ? steps : steps.slice(i)
}

// "Paso X de N" (N solo cuando el flujo ya está definido).
export function stepLabel(steps: StepKey[], current: StepKey, entry: StepKey | null): string {
  const visible = visibleSteps(steps, entry)
  const n = visible.indexOf(current) + 1
  if (n === 0) return ""
  return isComplete(steps) ? `Paso ${n} de ${visible.length}` : `Paso ${n}`
}

// El paso anterior, o null si no hay (el primero, o el de entrada de un
// link directo: de ahí se vuelve al lugar).
export function previousStep(steps: StepKey[], current: StepKey, entry: StepKey | null): StepKey | null {
  const visible = visibleSteps(steps, entry)
  const i = visible.indexOf(current)
  return i > 0 ? visible[i - 1] : null
}

export function nextStep(steps: StepKey[], current: StepKey): StepKey | null {
  const i = steps.indexOf(current)
  return i !== -1 && i < steps.length - 1 ? steps[i + 1] : null
}

// Desde el resumen se puede ir a editar un paso si está en el flujo y, con
// link directo, no es anterior al de entrada (el lugar y el sector quedan
// fijos).
export function canEdit(steps: StepKey[], target: StepKey, entry: StepKey | null): boolean {
  return visibleSteps(steps, entry).includes(target) && target !== "resumen"
}

// Se está cargando un lugar nuevo (y no solo sumando algo a uno existente).
export function createsSpot(steps: StepKey[]): boolean {
  return steps.includes("info")
}

// Nombre corto de cada paso para el indicador del encabezado.
const STEP_NAMES: Record<StepKey, string> = {
  categoria: "Categoría", modo: "Qué agregás", lugar: "Lugar", sector: "Sector", info: "Datos",
  glamping_unidades: "Alojamientos", motorhome: "Motorhome", amenities: "Servicios",
  experiencias: "Experiencias", trekking_caracteristicas: "Características", rutas: "Rutas",
  sectores: "Sectores", sector_nuevo: "Sector", vias: "Vías", vias_nuevas: "Vías",
  servicio: "Escuela", imagenes: "Fotos", adicionales: "Más categorías", resumen: "Revisar",
}

export function stepName(key: StepKey, category: string | null): string {
  if (key === "servicio" && category === "Kayak") return "Servicio"
  return STEP_NAMES[key]
}

export type StepProgressItem = { key: StepKey; label: string; state: "done" | "current" | "todo" }

// Los pasos para el indicador, desde el de entrada si vino por link directo.
export function stepProgress(steps: StepKey[], current: StepKey, entry: StepKey | null, category: string | null): StepProgressItem[] {
  const visible = visibleSteps(steps, entry)
  const i = visible.indexOf(current)
  return visible.map((key, j) => ({
    key, label: stepName(key, category), state: j < i ? "done" : j === i ? "current" : "todo",
  }))
}
