export type AdminSpot = {
  id: number
  name: string
  description?: string
  department: string
  is_approved: boolean
  owner_email: string | null
  owner_deleted_at: string | null
  // Lo cargó un visitante (no el responsable): al aprobarlo pasa a ser del admin.
  suggested_by_visitor?: boolean
  slug: string | null
  created_at: string
  category: { name: string } | null
  images: { cloudinary_public_id: string; is_main: boolean; order: number }[]
  review_count?: number
  // Rechazado (nuevo) o despublicado (estaba aprobado), con el motivo que ve
  // el dueño. Con fecha = esperando que el dueño corrija y lo reenvíe.
  rejection_reason?: string | null
  rejected_at?: string | null
}

export type SpotStatus = "pending" | "approved" | "rejected"
export type SpotFilter = SpotStatus | "all"

export function spotStatus(s: AdminSpot): SpotStatus {
  if (s.is_approved) return "approved"
  return s.rejected_at ? "rejected" : "pending"
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

export type AdminMode = "spots" | "cambios" | "reportes" | "reclamos" | "fotos" | "cuentas-eliminadas"

export type SortBy = "name" | "category" | "department" | "date_desc" | "date_asc"
