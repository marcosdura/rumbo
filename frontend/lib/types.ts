// Respuestas públicas del backend que usan las páginas del servidor
// (metadata, JSON-LD y la página en sí). Solo los campos que se leen.

// GET /{surf,kayak}-reviews/{id}/summary
export type ReviewSummary = { average: number | null; total: number }

// Lo común de GET /surfschool/{id} y GET /kayak/{id} (backend/schemas.py).
export type PublicOperatorBase = {
  id: number
  name: string
  duration: number | null
  email: string | null; whatsapp: string | null; instagram: string | null
  season_start: number | null; season_end: number | null
  photo_1: string | null; photo_2: string | null; photo_3: string | null
  spot_id: number | null; spot_name: string | null; spot_department: string | null
  // La playa o laguna: para llevar a su página y a "Cómo llegar".
  spot_slug: string | null; spot_lat: number | null; spot_lng: number | null
  // Qué ofrece y cuánto sale: precio "desde" (pesos) con una nota libre.
  description: string | null
  price_from: number | null; price_note: string | null
}

export type PublicSurfSchool = PublicOperatorBase & {
  class_type: string | null
  equipment_include: boolean | null
  // null = no sé.
  levels: string[] | null
  languages: string[] | null
}

export type PublicKayak = PublicOperatorBase & {
  water_type: string | null
  difficulty: string | null
  kayak_type: string | null
  rental_available: boolean | null
  // null = no sé.
  includes_guide: boolean | null
  includes_life_jacket: boolean | null
}

// GET /spots/by-slug/{slug}. SpotDetails (.jsx) usa muchos más campos.
export type PublicSpot = {
  id: number
  name: string
  description: string | null
  department: string | null
  lat: number | null; lng: number | null
  average_rating: number | null; review_count: number
  images?: { cloudinary_public_id: string; is_main: boolean }[]
  trekking_detail?: unknown
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
export type MyReview = {
  id: number
  spot_id: number
  spot_name: string
  spot_slug: string | null
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
