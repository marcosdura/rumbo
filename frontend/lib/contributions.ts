// Aportes: cosas nuevas sumadas a un lugar ya aprobado, que pasan por
// revisión (backend/contributions.py). Lo comparten "Tus aportes" en
// /profile y la pestaña "Cambios pendientes" del admin.

export type ContributionKind =
  | "experience" | "glamping_unit" | "trekking_route" | "climbing_sector"
  | "climbing_route" | "surf_school" | "kayak" | "photo" | "track"

export type ContributionStatus = "pending" | "approved" | "rejected" | "withdrawn"

export type ContributionSpot = {
  id: number; name: string; slug: string | null; department: string | null
  category: { name: string } | null; owner_email?: string | null
}

export type Contribution = {
  id: number
  kind: ContributionKind
  item_id: number
  spot_id: number
  status: ContributionStatus
  title: string
  reject_reason: string | null
  created_at: string | null
  resolved_at: string | null
  spot: ContributionSpot
}

// Lo que ve el admin: además, quién lo propuso y el elemento completo.
export type AdminContribution = Contribution & {
  author_email: string
  item: Record<string, unknown> & { routes?: Record<string, unknown>[] } | null
  sector_name?: string | null
}

export const KIND_LABELS: Record<ContributionKind, string> = {
  experience: "Experiencia",
  glamping_unit: "Alojamiento de glamping",
  trekking_route: "Ruta de trekking",
  climbing_sector: "Sector de escalada",
  climbing_route: "Vía de escalada",
  surf_school: "Escuela de surf",
  kayak: "Kayak",
  photo: "Foto",
  track: "Recorrido (GPX)",
}

// Campos del elemento que se muestran al admin para revisarlo, por tipo.
// [campo, etiqueta]
export const KIND_FIELDS: Record<ContributionKind, [string, string][]> = {
  experience: [["title", "Título"], ["description", "Descripción"], ["price", "Precio"], ["schedule", "Horario"], ["contact", "Contacto"]],
  glamping_unit: [["accommodation_type", "Tipo"], ["capacity", "Capacidad"], ["price_per_night", "Precio por noche"], ["min_nights", "Mínimo de noches"]],
  trekking_route: [["name", "Nombre"], ["distance_km", "Distancia (km)"], ["duration_hours", "Duración (h)"], ["difficulty", "Dificultad"], ["elevation_gain", "Desnivel +"]],
  climbing_sector: [["name", "Nombre"], ["type", "Tipo"], ["max_altitude", "Altitud máxima"], ["restrictions", "Restricciones"]],
  climbing_route: [["name", "Nombre"], ["grade", "Grado"], ["type", "Tipo"], ["length", "Largo (m)"], ["bolts", "Chapas"], ["description", "Descripción"]],
  surf_school: [["name", "Nombre"], ["class_type", "Tipo de clase"], ["duration", "Duración (h)"], ["email", "Email"], ["whatsapp", "WhatsApp"], ["instagram", "Instagram"]],
  kayak: [["name", "Nombre"], ["water_type", "Tipo de agua"], ["difficulty", "Dificultad"], ["duration", "Duración (h)"], ["email", "Email"], ["whatsapp", "WhatsApp"]],
  // Foto de una ruta, sector o vía: la foto se ve en itemPhotos.
  photo: [["target_name", "De"]],
  // El recorrido de una ruta: un resumen (el mapa se ve al aprobarlo).
  track: [["target_name", "Ruta"], ["distance_km", "Distancia (km)"], ["elevation_gain", "Desnivel +"], ["points_count", "Puntos"]],
}

// Pares [etiqueta, valor] con lo que el elemento tiene cargado.
export function itemDetails(kind: ContributionKind, item: Record<string, unknown> | null): [string, string][] {
  if (!item) return []
  return KIND_FIELDS[kind]
    .filter(([field]) => item[field] !== null && item[field] !== undefined && item[field] !== "")
    .map(([field, label]) => [label, String(item[field])])
}

// Fotos de surf y kayak (URLs completas de Cloudinary).
export function itemPhotos(item: Record<string, unknown> | null): string[] {
  if (!item) return []
  // Fotos de rutas, sectores y vías: se guarda el public_id, no la URL.
  if (typeof item.cloudinary_public_id === "string") {
    return [`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${item.cloudinary_public_id}`]
  }
  return ["photo_1", "photo_2", "photo_3"]
    .map(k => item[k])
    .filter((v): v is string => typeof v === "string" && v.length > 0)
}
