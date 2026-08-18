export type AdminSpot = {
  id: number
  name: string
  description?: string
  department: string
  is_approved: boolean
  owner_email: string | null
  owner_deleted_at: string | null
  slug: string | null
  created_at: string
  category: { name: string } | null
  images: { cloudinary_public_id: string; is_main: boolean; order: number }[]
  review_count?: number
}

export type AdminMode = "spots" | "fotos" | "cuentas-eliminadas"

export type SortBy = "name" | "category" | "department" | "date_desc" | "date_asc"
