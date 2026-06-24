import type { Category, TrekkingFeatureKey, TrekkingFeatures, RouteItem, SectorItem, SurfItem, KayakItem, BasicInfo, MotorhomeDetailItem, CampingDetailItem, GlampingDetailItem, ClimbingRouteItem, PhoneCountry } from "./types"

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "UY", name: "Uruguay",        dial: "598", digits: 8 },
  { code: "AR", name: "Argentina",      dial: "54",  digits: 10 },
  { code: "BR", name: "Brasil",         dial: "55",  digits: 11 },
  { code: "CL", name: "Chile",          dial: "56",  digits: 9 },
  { code: "PY", name: "Paraguay",       dial: "595", digits: 9 },
  { code: "ES", name: "España",         dial: "34",  digits: 9 },
  { code: "US", name: "Estados Unidos", dial: "1",   digits: 10 },
]

export const CATEGORIES: Category[] = [
  { id: 1, name: "Camping",  label: "Camping",  emoji: "⛺" },
  { id: 6, name: "Glamping", label: "Glamping", emoji: "🛖" },
  { id: 2, name: "Trekking", label: "Trekking", emoji: "🥾" },
  { id: 3, name: "Escalada", label: "Escalada", emoji: "🧗" },
  { id: 4, name: "Surf",     label: "Surf",     emoji: "🏄" },
  { id: 5, name: "Kayak",    label: "Kayak",    emoji: "🛶" },
  { id: 8, name: "Motorhome", label: "Motorhome", emoji: "🚐" },
]

export const DEPARTMENTS = [
  "Artigas","Canelones","Cerro Largo","Colonia","Durazno","Flores","Florida",
  "Lavalleja","Maldonado","Montevideo","Paysandú","Río Negro","Rivera","Rocha",
  "Salto","San José","Soriano","Tacuarembó","Treinta y Tres",
]

export const MONTHS = [
  { value: "1",  label: "Enero" },    { value: "2",  label: "Febrero" },
  { value: "3",  label: "Marzo" },    { value: "4",  label: "Abril" },
  { value: "5",  label: "Mayo" },     { value: "6",  label: "Junio" },
  { value: "7",  label: "Julio" },    { value: "8",  label: "Agosto" },
  { value: "9",  label: "Setiembre" },{ value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },{ value: "12", label: "Diciembre" },
]

export const AMENITY_CATEGORIES = [
  {
    id: "esenciales", label: "Esenciales", emoji: "⚡",
    names: ["Ducha","Agua caliente","Baños","Agua potable","Electricidad","Tomas para camper/van","Área para motorhomes"],
  },
  {
    id: "cocina", label: "Cocina & comida", emoji: "🍽️",
    names: ["Cocina compartida","Heladera","Comedor","Parrillero","Leña disponible","Proveeduría/kiosco","Cafetería","Restaurante/bar"],
  },
  {
    id: "actividades", label: "Actividades & diversión", emoji: "🏄",
    names: ["Acceso a río/lago/mar","Playa","Piscina","Cancha de fútbol","Cancha de Voley","Alquiler de bicis","Kayak"],
  },
  {
    id: "comodidades", label: "Comodidades del sitio", emoji: "🏕️",
    names: ["Parcelas delimitadas","Mesas y bancos","Zona para fogón","Sombra","Lavadero"],
  },
  {
    id: "extras", label: "Extras & servicios", emoji: "🔧",
    names: ["WiFi","Seguridad","Estacionamiento","Acepta mascotas"],
  },
]

export const AMENITY_ICONS: Record<string, string> = {
  "Ducha":"🚿","Agua caliente":"🔥","Baños":"🚽","Agua potable":"🚰",
  "Electricidad":"⚡","Lavadero":"🧼","Parrillero":"🔥",
  "Cocina compartida":"🍳","Comedor":"🍽️","Heladera":"🧊",
  "Leña disponible":"🪵","Sombra":"🌳","Mesas y bancos":"🪑",
  "Parcelas delimitadas":"⛺","Acceso a río/lago/mar":"🌊","Playa":"🏖️",
  "Cancha de fútbol":"⚽","Cancha de Voley":"🏐","Piscina":"🏊",
  "Alquiler de bicis":"🚴","Kayak":"🛶","WiFi":"🛜",
  "Acepta mascotas":"🐶","Proveeduría/kiosco":"🛒","Cafetería":"☕",
  "Restaurante/bar":"🍺","Estacionamiento":"🚗","Seguridad":"🔒",
  "Zona para fogón":"🏕️","Tomas para camper/van":"🔌","Área para motorhomes":"🚐",
  "Cama incluida":             "🛏️",
  "Ropa de cama":              "🛌",
  "Baño privado":              "🚿",
  "Calefacción":               "🌡️",
  "Aire acondicionado":        "❄️",
  "Desayuno incluido":         "🥐",
  "Cocina equipada":           "🍳",
  "Parrilla privada":          "🔥",
  "Terraza / deck":            "🌅",
  "Vista panorámica":          "🏔️",
  "Fogón privado":             "🔥",
  "Bañera / jacuzzi":          "🛁",
  "Zona de descanso exterior": "🌿",
}

export const GLAMPING_AMENITY_CATEGORIES = [
  {
    id: "alojamiento",
    label: "Alojamiento",
    emoji: "🛏️",
    names: ["Cama incluida", "Ropa de cama", "Baño privado", "Calefacción", "Aire acondicionado"],
  },
  {
    id: "comidas-glamp",
    label: "Comidas & cocina",
    emoji: "🍽️",
    names: ["Desayuno incluido", "Cocina equipada", "Parrilla privada", "Heladera"],
  },
  {
    id: "experiencia",
    label: "Experiencia glamping",
    emoji: "🌿",
    names: ["Terraza / deck", "Vista panorámica", "Fogón privado", "Bañera / jacuzzi", "Zona de descanso exterior"],
  },
  {
    id: "servicios-glamp",
    label: "Servicios",
    emoji: "⚡",
    names: ["WiFi", "Electricidad", "Agua caliente", "Acepta mascotas", "Estacionamiento"],
  },
  {
    id: "extras-glamp",
    label: "Extras",
    emoji: "📷",
    names: ["Piscina", "Acceso a río/lago/mar"],
  },
]

export const TREKKING_FEATURES: { key: TrekkingFeatureKey; label: string; emoji: string }[] = [
  { key: "bathrooms",     label: "Baños",           emoji: "🚽" },
  { key: "potable_water", label: "Agua potable",     emoji: "🚰" },
  { key: "pet_friendly",  label: "Pet friendly",     emoji: "🐶" },
  { key: "kids_friendly", label: "Apto niños",       emoji: "👶" },
  { key: "camping",       label: "Camping",          emoji: "⛺" },
  { key: "parking",       label: "Estacionamiento",  emoji: "🚗" },
  { key: "fire_pits",     label: "Fogones",          emoji: "🔥" },
  { key: "shelter",       label: "Refugio",          emoji: "🏠" },
  { key: "accessible",    label: "Accesible",        emoji: "♿" },
  { key: "signal",        label: "Señal móvil",      emoji: "📱" },
]

export const REQUIRED_FEATURE_KEYS: TrekkingFeatureKey[] = [
  "bathrooms", "potable_water", "pet_friendly", "kids_friendly",
  "camping", "parking", "fire_pits", "shelter", "accessible",
]

export const defaultTrekkingFeatures = (): TrekkingFeatures => ({
  bathrooms: null, potable_water: null, pet_friendly: null, kids_friendly: null,
  camping: null, parking: null, fire_pits: null, shelter: null, accessible: null, signal: null,
})

export const defaultRoute = (): RouteItem => ({
  name: "", distance_km: "", duration_hours: "", elevation_gain: "", elevation_loss: "",
  max_altitude: "", min_altitude: "", difficulty: "", route_type: "",
  technical_level: "", physical_demand: "",
})

export const defaultSector = (): SectorItem => ({ name: "", type: "", max_altitude: "", restrictions: "" })

export const defaultSurf = (): SurfItem => ({
  name: "", class_type: "", duration: "", equipment_include: false,
  season_type: "all_year", season_start: "", season_end: "",
  email: "", whatsapp: "", instagram: "",
})

export const defaultKayak = (): KayakItem => ({
  name: "", water_type: "", difficulty: "", duration: "", kayak_type: "",
  rental_available: false, season_type: "all_year", season_start: "", season_end: "",
  email: "", whatsapp: "", instagram: "",
})

export const emptyBasic = (): BasicInfo => ({
  name: "", description: "", department: "",
  price: "", season_type: "all_year",
  season_start: "", season_end: "",
  email: "", whatsapp: "", whatsappCountry: "UY", instagram: "", lat: "", lng: "",
})

export const defaultMotorhomeDetail = (): MotorhomeDetailItem => ({
  capacity: "", surface_type: "", has_water: null,
  has_electricity: null, has_dump_station: null, max_stay_nights: "",
})

export const defaultCampingDetail = (): CampingDetailItem => ({
  price: "",
})

export const defaultGlampingDetail = (): GlampingDetailItem => ({
  accommodation_type: "", capacity: "", price_per_night: "", min_nights: "",
})

export const GLAMPING_AMENITY_MAP: Record<string, string> = {
  "Baño privado": "private_bathroom",
  "Electricidad": "electricity",
  "WiFi": "wifi",
  "Desayuno incluido": "breakfast_included",
  "Acepta mascotas": "pet_friendly",
  "Calefacción": "heating",
  "Aire acondicionado": "air_conditioning",
  "Cocina equipada": "kitchen",
  "Ropa de cama": "towels_included",
  "Estacionamiento": "parking",
}

export const defaultClimbingRouteItem = (sectorIndex: number = 0): ClimbingRouteItem => ({
  name: "", grade: "", type: "", length_m: "", bolts: "", description: "", sectorIndex,
})
