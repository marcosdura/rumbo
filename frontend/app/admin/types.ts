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

// Pedido de cambio pendiente (GET /admin/change-requests). spot.current es
// el valor de hoy: si difiere de changes[campo].from, el spot se editó
// mientras el pedido esperaba.
export type AdminChangeRequest = {
  id: number
  spot_id: number
  status: "pending"
  requested_by: string
  created_at: string | null
  changes: {
    name?: { from: string; to: string }
    description?: { from: string; to: string }
    photos_added?: string[]
  }
  spot: {
    id: number
    name: string
    slug: string | null
    department: string
    category: { name: string } | null
    images: { cloudinary_public_id: string; is_main: boolean; order: number }[]
    current: { name: string; description: string }
  }
}

export type AdminMode = "spots" | "cambios" | "fotos" | "cuentas-eliminadas"

export type SortBy = "name" | "category" | "department" | "date_desc" | "date_asc"
