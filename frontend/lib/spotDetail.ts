// Lo que muestra el panel "Detalles" de la página de un lugar. Solo lo que
// se sabe y lo que no está ya en otro lado: departamento y categoría van en
// las pills del encabezado, y el acceso público/privado en su banner.
import { priceLabel, seasonNotice, type CardSpot } from "./spotCard"

export type DetailSpot = CardSpot & {
  public_transport?: string | null
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

// "Nov – Mar". Sin los dos meses no se sabe la temporada: null (antes decía
// "Todo el año", que es afirmar algo que nadie cargó).
export function seasonLabel(start?: number | null, end?: number | null): string | null {
  if (!start || !end) return null
  return `${MESES[start - 1]} – ${MESES[end - 1]}`
}

const TRANSPORT: Record<string, string> = { si: "🚌 Accesible", no: "🚗 No accesible" }

export function detailRows(spot: DetailSpot): { label: string; value: string }[] {
  // El precio va por la categoría principal (spot.category): en el detalle,
  // categories viene en el orden en que se sumaron, no con la principal primero.
  const price = priceLabel({ ...spot, categories: null })
  const season = seasonLabel(spot.season_start, spot.season_end)
  const transport = spot.public_transport ? TRANSPORT[spot.public_transport] : undefined
  return [
    price ? { label: "Precio", value: price } : null,
    season ? { label: "Temporada", value: season } : null,
    transport ? { label: "Transporte público", value: transport } : null,
  ].filter((r): r is { label: string; value: string } => r !== null)
}

// Para el encabezado: "Fuera de temporada · abre en noviembre".
export function offSeasonNotice(spot: CardSpot, now = new Date()): string | null {
  const notice = seasonNotice(spot, now)
  return notice ? `Fuera de temporada · ${notice.charAt(0).toLowerCase()}${notice.slice(1)}` : null
}
