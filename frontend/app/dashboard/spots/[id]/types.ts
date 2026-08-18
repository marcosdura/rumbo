export type SpotImage = { cloudinary_public_id: string; is_main: boolean; order: number }

export type Review = {
  id: number; rating: number; comment: string | null; created_at: string
  user: { name: string | null; image: string | null }
}

export type Spot = {
  id: number; name: string; slug: string | null; description: string
  department: string; email: string | null; whatsapp: string | null
  instagram: string | null; price: number | null
  season_start: number | null; season_end: number | null
  is_public: boolean | null; public_transport: string | null
  is_approved: boolean; category: { name: string } | null
  images: SpotImage[]; average_rating: number | null; review_count: number
}

export type Tab = "info" | "fotos" | "reviews"
