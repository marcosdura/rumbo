export type Category = { id: number; name: string; label: string; emoji: string }

export type TrekkingFeatureKey =
  | "bathrooms" | "potable_water" | "pet_friendly" | "kids_friendly"
  | "camping" | "parking" | "fire_pits" | "shelter" | "accessible" | "signal"

export type TrekkingFeatures = Record<TrekkingFeatureKey, boolean | null>

export type RouteItem = {
  name: string; distance_km: string; duration_hours: string
  elevation_gain: string; elevation_loss: string; max_altitude: string; min_altitude: string
  difficulty: string; route_type: string; technical_level: string; physical_demand: string
}

export type SectorItem = { name: string; type: string; max_altitude: string; restrictions: string }

export type SurfItem = {
  name: string; class_type: string; duration: string; equipment_include: boolean
  season_type: "all_year" | "seasonal"; season_start: string; season_end: string
  email: string; whatsapp: string; instagram: string
}

export type KayakItem = {
  name: string; water_type: string; difficulty: string; duration: string; kayak_type: string
  rental_available: boolean
  season_type: "all_year" | "seasonal"; season_start: string; season_end: string
  email: string; whatsapp: string; instagram: string
}

export type ClimbingMode = "new_spot" | "new_sector" | "new_route" | null

export type ClimbingRouteForm = {
  name: string; grade: string; type: string; length_m: string; bolts: string; description: string
}

export type BasicInfo = {
  owner_contact_type: "email" | "phone"
  owner_email: string; owner_phone: string
  name: string; description: string; department: string
  price: string; season_type: "all_year" | "seasonal"
  season_start: string; season_end: string
  email: string; whatsapp: string; instagram: string
  lat: string; lng: string
}
