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

// El precio según la categoría principal: por noche en camping, "desde" el
// alojamiento más barato en glamping; si no, la entrada. null si no se sabe.
export function priceLabel(spot: CardSpot): string | null {
  const category = primaryCategory(spot)
  if (category === "Glamping") {
    const prices = (spot.glamping_detail ?? []).map(u => u.price_per_night).filter((p): p is number => typeof p === "number" && p > 0)
    return prices.length ? `Desde ${money(Math.min(...prices))} / noche` : null
  }
  if (spot.price == null) return null
  if (spot.price === 0) return "Gratis"
  return category === "Camping" ? `${money(spot.price)} / noche` : `Entrada ${money(spot.price)}`
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

// La línea de datos de la card, en orden: precio, temporada, mascotas.
export function factsLine(spot: CardSpot, now = new Date()): string[] {
  return [priceLabel(spot), seasonNotice(spot, now), spot.pets_allowed ? "🐶 Acepta mascotas" : null]
    .filter((f): f is string => !!f)
}
