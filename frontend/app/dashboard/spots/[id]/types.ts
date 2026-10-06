export type SpotImage = { cloudinary_public_id: string; is_main: boolean; order: number }

export type Review = {
  id: number; rating: number; comment: string | null; created_at: string
  user: { name: string | null; image: string | null }
}

// Pedido de cambio sobre un spot aprobado (backend/spot_changes.py). Viene
// en /spots/mine: el pendiente, o el último aprobado/rechazado que el dueño
// todavía no cerró.
export type ChangeRequest = {
  id: number
  status: "pending" | "approved" | "rejected" | "cancelled"
  changes: {
    name?: { from: string; to: string }
    description?: { from: string; to: string }
    photos_added?: string[]
  }
  reject_reason: string | null
  created_at: string | null
  resolved_at: string | null
}

// Foto elegida en el dashboard que todavía no se subió: se sube a
// Cloudinary recién al tocar Guardar.
export type StagedPhoto = { file: File; url: string }

export type Spot = {
  id: number; name: string; slug: string | null; description: string
  department: string; email: string | null; whatsapp: string | null
  instagram: string | null; price: number | null
  season_start: number | null; season_end: number | null
  is_public: boolean | null; public_transport: string | null
  is_approved: boolean; category: { name: string } | null
  images: SpotImage[]; average_rating: number | null; review_count: number
  change_request: ChangeRequest | null
}

export type Tab = "info" | "fotos" | "reviews"
