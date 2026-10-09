// Lo que muestra la card de un lugar (SpotCard) además del nombre: la
// calificación o "Nuevo", y una línea con el dato clave (precio), si está
// fuera de temporada y si acepta mascotas. Todo sale de lo que ya trae el
// listado (GET /spots, /home, /favorites).

export type CardSpot = {
  price?: number | null
  created_at?: string | null
  season_start?: number | null
  season_end?: number | null
  pets_allowed?: boolean | null
  average_rating?: number | null
  review_count?: number
  glamping_detail?: { price_per_night?: number | null }[] | null
  category?: { name: string } | null
  categories?: { name: string }[] | null
  // Solo en "Cerca de acá" (GET /spots/{id}/nearby).
  distance_km?: number | null
}

const NEW_DAYS = 30

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

const money = (n: number) => `$${Math.round(n).toLocaleString("es-UY")}`

function primaryCategory(spot: CardSpot): string | null {
  return spot.categories?.[0]?.name ?? spot.category?.name ?? null
}

// "★ 4.6 (12)" si tiene reseñas; si no, "Nuevo" (publicado hace menos de 30
// días) o "Sin reseñas". Siempre hay algo: las cards de una fila quedan del
// mismo alto.
export function ratingLabel(spot: CardSpot, now = new Date()): { kind: "rating" | "new" | "none"; text: string } {
  if (spot.review_count && spot.review_count > 0 && spot.average_rating != null) {
    return { kind: "rating", text: `${spot.average_rating} (${spot.review_count})` }
  }
  if (spot.created_at) {
    const created = new Date(spot.created_at)
    if (!Number.isNaN(created.getTime()) && now.getTime() - created.getTime() < NEW_DAYS * 86_400_000) {
      return { kind: "new", text: "Nuevo" }
    }
  }
  return { kind: "none", text: "Sin reseñas" }
}

// Solo los alojamientos tienen un precio propio del lugar (por noche). En
// trekking, escalada, surf o kayak el precio no es del lugar (lo cobra, si
// acaso, una escuela o un servicio): no se muestra.
const PRICED_PER_NIGHT = ["Camping", "Motorhome"]

// El precio según la categoría principal: por noche en camping y motorhome,
// "desde" el alojamiento más barato en glamping. null si no aplica o no se sabe.
export function priceLabel(spot: CardSpot): string | null {
  const category = primaryCategory(spot)
  if (category === "Glamping") {
    const prices = (spot.glamping_detail ?? []).map(u => u.price_per_night).filter((p): p is number => typeof p === "number" && p > 0)
    return prices.length ? `Desde ${money(Math.min(...prices))} / noche` : null
  }
  if (!category || !PRICED_PER_NIGHT.includes(category) || spot.price == null) return null
  return spot.price === 0 ? "Gratis" : `${money(spot.price)} / noche`
}

// "Abre en noviembre" si hoy está fuera de temporada. La temporada puede
// cruzar el año (de noviembre a marzo).
export function seasonNotice(spot: CardSpot, now = new Date()): string | null {
  const start = spot.season_start, end = spot.season_end
  if (!start || !end) return null
  const month = now.getMonth() + 1
  const open = start <= end ? month >= start && month <= end : month >= start || month <= end
  return open ? null : `Abre en ${MONTHS[start - 1]}`
}

// "a 2,5 km" (con decimal solo por debajo de 10 km).
export function distanceLabel(km: number): string {
  const n = km < 10 ? Math.round(km * 10) / 10 : Math.round(km)
  return `📍 a ${n.toLocaleString("es-UY")} km`
}

// La línea de datos de la card, en orden: distancia (en "Cerca de acá"),
// precio, temporada, mascotas.
export function factsLine(spot: CardSpot, now = new Date()): string[] {
  return [
    spot.distance_km != null ? distanceLabel(spot.distance_km) : null,
    priceLabel(spot), seasonNotice(spot, now), spot.pets_allowed ? "🐶 Acepta mascotas" : null,
  ]
    .filter((f): f is string => !!f)
}
