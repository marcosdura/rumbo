// Filtros de Glamping y Motorhome (backend: glamping_price,
// glamping_amenity, motorhome_service en GET /spots).

// Por el alojamiento más barato del lugar, el mismo precio que muestra la
// card ("Desde $X / noche"). Los límites son los del backend.
export const GLAMPING_PRICE_RANGES = [
  { value: "bajo", label: "Hasta $3.000" },
  { value: "medio", label: "$3.000 – $6.000" },
  { value: "alto", label: "Más de $6.000" },
] as const

export const GLAMPING_AMENITIES = [
  { value: "private_bathroom", label: "Baño privado", emoji: "🚿" },
  { value: "electricity", label: "Electricidad", emoji: "⚡" },
  { value: "wifi", label: "WiFi", emoji: "🛜" },
  { value: "breakfast_included", label: "Desayuno incluido", emoji: "🥐" },
  { value: "heating", label: "Calefacción", emoji: "🌡️" },
  { value: "air_conditioning", label: "Aire acondicionado", emoji: "❄️" },
  { value: "kitchen", label: "Cocina equipada", emoji: "🍳" },
  { value: "towels_included", label: "Ropa de cama", emoji: "🛌" },
  { value: "parking", label: "Estacionamiento", emoji: "🚗" },
] as const

export interface GlampingFilterState {
  priceRanges: string[]
  amenities: string[]
}

export const EMPTY_GLAMPING_FILTERS: GlampingFilterState = { priceRanges: [], amenities: [] }

export const MOTORHOME_SERVICES = [
  { value: "water", label: "Agua", emoji: "💧" },
  { value: "electricity", label: "Electricidad", emoji: "⚡" },
  { value: "dump", label: "Vaciado de aguas", emoji: "🚽" },
] as const

export interface MotorhomeFilterState {
  services: string[]
}

export const EMPTY_MOTORHOME_FILTERS: MotorhomeFilterState = { services: [] }
