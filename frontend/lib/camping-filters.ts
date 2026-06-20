export const CAMPING_AMENITY_GROUPS = [
  {
    label: "Básicos",
    amenities: [
      { id: 1,  label: "Ducha" },
      { id: 2,  label: "Agua caliente" },
      { id: 3,  label: "Baños" },
      { id: 4,  label: "Agua potable" },
      { id: 5,  label: "Electricidad" },
      { id: 22, label: "WiFi" },
    ],
  },
  {
    label: "Cocina",
    amenities: [
      { id: 7,  label: "Parrillero" },
      { id: 8,  label: "Cocina compartida" },
      { id: 9,  label: "Comedor" },
      { id: 10, label: "Heladera" },
      { id: 11, label: "Leña disponible" },
      { id: 24, label: "Proveeduría/kiosco" },
    ],
  },
  {
    label: "Actividades",
    amenities: [
      { id: 15, label: "Acceso a río/lago/mar" },
      { id: 16, label: "Playa" },
      { id: 21, label: "Kayak" },
      { id: 20, label: "Alquiler de bicis" },
      { id: 17, label: "Cancha de fútbol" },
      { id: 18, label: "Cancha de vóley" },
      { id: 19, label: "Piscina" },
    ],
  },
  {
    label: "Servicios",
    amenities: [
      { id: 27, label: "Estacionamiento" },
      { id: 28, label: "Seguridad" },
      { id: 23, label: "Acepta mascotas" },
      { id: 30, label: "Tomas para camper/van" },
    ],
  },
] as const

export const CAMPING_PRICE_RANGES = [
  { value: "gratis", label: "Gratis" },
  { value: "bajo",   label: "Bajo (< $300)" },
  { value: "medio",  label: "Medio ($300–$800)" },
  { value: "alto",   label: "Alto (+ $800)" },
] as const

export type PriceRangeValue = typeof CAMPING_PRICE_RANGES[number]["value"]

export interface CampingFilterState {
  amenityIds:  number[]
  priceRanges: PriceRangeValue[]
}

export const EMPTY_CAMPING_FILTERS: CampingFilterState = {
  amenityIds:  [],
  priceRanges: [],
}

export function countActiveCampingFilters(f: CampingFilterState): number {
  return f.amenityIds.length + f.priceRanges.length
}
