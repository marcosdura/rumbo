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

export type TrekkingMode = "new_spot" | "new_route" | null

export type BasicInfo = {
  name: string; description: string; department: string
  price: string; season_type: "all_year" | "seasonal"
  season_start: string; season_end: string
  email: string; whatsapp: string; whatsappCountry: string; instagram: string
  noContact: boolean
  lat: string; lng: string
}

export type PhoneCountry = { code: string; name: string; dial: string; digits: number; trunkPrefix?: string; example?: string }

export type MotorhomeDetailItem = {
  capacity: string
  surface_type: string
  has_water: boolean | null
  has_electricity: boolean | null
  has_dump_station: boolean | null
  max_stay_nights: string
}

export type CampingDetailItem = {
  price: string
}

export type GlampingDetailItem = {
  accommodation_type: string
  capacity: string
  price_per_night: string
  min_nights: string
}

export type ClimbingRouteItem = {
  name: string
  grade: string
  type: string
  length_m: string
  bolts: string
  description: string
  sectorIndex: number
}

export type ExperienceScheduleType = "todos_los_dias" | "fines_de_semana" | "solo_sabados" | "solo_domingos" | "lunes_a_viernes" | "bajo_reserva" | "personalizado"

export type ExperienceItem = {
  category_id: string
  title: string
  description: string
  price: string
  schedule_type: ExperienceScheduleType | ""
  schedule_custom: string
  contact: string
}
