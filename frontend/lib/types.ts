// Respuestas públicas del backend que usan las páginas del servidor
// (metadata, JSON-LD y la página en sí). Solo los campos que se leen.

// Los datos de un lugar de trekking (null = no se sabe).
export type TrekkingDetail = Partial<Record<
  "bathrooms" | "potable_water" | "kids_friendly" | "camping" | "parking" | "fire_pits" | "shelter" | "accessible",
  boolean | null
>>

// GET /spots/by-slug/{slug}. SpotDetails usa muchos más campos (SpotPageData).
export type PublicSpot = {
  id: number
  name: string
  description: string | null
  department: string | null
  lat: number | null; lng: number | null
  average_rating: number | null; review_count: number
  images?: { cloudinary_public_id: string; is_main: boolean }[]
  trekking_detail?: TrekkingDetail | null
  [key: string]: unknown
}

// GET /routes/{id} y /routes/by-slug/{slug}
export type PublicRoute = {
  name: string
  distance_km: number | null
  duration_hours: number | null
  difficulty: string | null
}

// GET /sectors/by-slug/{slug}
export type PublicSector = {
  name: string
  routes_count: number
  min_grade: string | null
  max_grade: string | null
}

type ImageRef = { cloudinary_public_id: string; is_main: boolean }

// Un spot en listados (/spots, /spots/pins, /favorites). SpotCard y el mapa
// (.jsx) leen más campos; acá van los que se usan desde TypeScript.
export type SpotListItem = {
  id: number
  name: string
  slug?: string | null
  images?: ImageRef[]
  [key: string]: unknown
}

// GET /spots/mine (para /profile).
export type MySpotSummary = SpotListItem & {
  is_approved: boolean
  rejected_at?: string | null
  change_request?: { status: string } | null
  review_count?: number
}

// GET /reviews/user/me
// GET /reviews/user/me: `href` lleva a las reseñas del lugar (las escuelas
// de surf y los servicios de kayak también son lugares).
export type MyReview = {
  kind: "spot"
  id: number
  target_name: string | null
  href: string | null
  rating: number
  comment: string | null
  created_at: string
  updated_at: string | null
}

// GET /sectors/{id} y /sectors/by-slug/{slug}
export type SectorDetail = PublicSector & {
  id: number
  spot_id: number
  type: string | null
  restrictions: string | null
  max_altitude: number | null
  // null = "no sé".
  approach_minutes: number | null
  sun_exposure: string | null
  rock_type: string | null
}

// GET /sectors/{id}/routes
export type ClimbingRoute = {
  id: number
  name: string
  grade: string | null
  length: number | null
  bolts: number | null
  description: string | null
}
