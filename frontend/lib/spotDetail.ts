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

// "← Volver": si se llegó desde otra página de Rumbo, vuelve a esa; si se
// entró por un link compartido (otro sitio o pestaña nueva), router.back()
// sacaba de Rumbo: va a la búsqueda.
export function cameFromRumbo(referrer: string, origin: string): boolean {
  try {
    return !!referrer && new URL(referrer).origin === origin
  } catch {
    return false
  }
}

// La foto al compartir el link (WhatsApp, redes): 1200×630 recortada por
// Cloudinary. La original puede pesar varios MB y a veces no aparece.
export function shareImageUrl(cloudName: string | undefined, publicId: string): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,g_auto,w_1200,h_630,q_auto,f_jpg/${publicId}`
}

// Cómo llegar: Google Maps directo a las coordenadas. Antes buscaba por el
// nombre, y con otro lugar llamado igual abría el equivocado.
export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

// WhatsApp con el mensaje ya escrito: le dice al lugar de dónde viene la
// consulta.
export function whatsappUrl(phone: string, spotName: string): string {
  const text = `Hola, te escribo por ${spotName}, que vi en Rumbo.`
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`
}
