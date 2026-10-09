import type { RouteItem, SectorItem } from "./types"

// Validaciones de los pasos con listas (rutas, sectores). Antes una fila sin
// nombre se descartaba en silencio al enviar: un aporte podía terminar en
// "¡Listo!" sin haber creado nada.

// Una foto elegida también es un dato: la fila no está vacía.
const hasData = (item: Record<string, unknown>) =>
  Object.values(item).some(v => (typeof v === "string" ? v.trim() !== "" : Array.isArray(v) && v.length > 0))

// Índices de las filas con datos pero sin nombre (una fila vacía se ignora).
export function unnamedRows<T extends RouteItem | SectorItem>(items: T[]): number[] {
  return items
    .map((item, i) => (hasData(item) && !item.name.trim() ? i : -1))
    .filter(i => i !== -1)
}

export function namedCount(items: { name: string }[]): number {
  return items.filter(item => item.name.trim()).length
}
