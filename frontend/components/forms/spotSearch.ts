// Lugares para elegir en agregar-lugar (playas, lagunas, lugares de
// escalada): vienen de /spots/pins, con coordenadas para el mapa.
export type PickableSpot = {
  id: number
  name: string
  department?: string | null
  lat?: number | null
  lng?: number | null
}

export function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()
}

// Busca por nombre o departamento, sin importar mayúsculas ni tildes: "la
// pedrera" encuentra "La Pedrera", "rocha" todas las de Rocha. Primero los
// que empiezan con lo escrito.
export function searchSpots(spots: PickableSpot[], query: string): PickableSpot[] {
  const q = normalize(query)
  if (!q) return spots
  const matches = spots.filter(sp =>
    normalize(sp.name).includes(q) || normalize(sp.department ?? "").includes(q))
  const starts = (sp: PickableSpot) => (normalize(sp.name).startsWith(q) ? 0 : 1)
  return [...matches].sort((a, b) => starts(a) - starts(b))
}

export function hasCoords(sp: PickableSpot): sp is PickableSpot & { lat: number; lng: number } {
  return typeof sp.lat === "number" && typeof sp.lng === "number"
}
