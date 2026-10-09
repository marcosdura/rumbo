import type { ChangeRequest } from "./types"
import { ApiError } from "@/lib/api"
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/uploadImage"
import { MAX_PHOTOS } from "./styles"

// Nombres legibles de los campos que devuelve el backend en applied/pending
// (PATCH /admin/spots/{id}). season_start/season_end se muestran juntos.
const FIELD_LABELS: Record<string, string> = {
  name: "nombre",
  description: "descripción",
  email: "email",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  price: "precio",
  season_start: "temporada",
  season_end: "temporada",
  is_public: "acceso público/privado",
  public_transport: "transporte público",
  pets_allowed: "mascotas",
  reservation_required: "reserva",
  cell_signal: "señal de celular",
}

function photosLabel(n: number) {
  return `${n} foto${n !== 1 ? "s" : ""} nueva${n !== 1 ? "s" : ""}`
}

// "nombre, descripción y 2 fotos nuevas"
export function joinLabels(labels: string[]) {
  if (labels.length <= 1) return labels.join("")
  return `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`
}

export function describeFields(fields: string[], photoCount: number) {
  const labels: string[] = []
  for (const f of fields) {
    const label = f === "photos_added" ? photosLabel(photoCount) : FIELD_LABELS[f]
    if (label && !labels.includes(label)) labels.push(label)
  }
  return joinLabels(labels)
}

export function describeRequest(req: ChangeRequest) {
  const c = req.changes
  const labels: string[] = []
  if (c.name) labels.push("nombre")
  if (c.description) labels.push("descripción")
  if (c.photos_added?.length) labels.push(photosLabel(c.photos_added.length))
  return joinLabels(labels)
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Qué hacer con los archivos que el dueño eligió para sumar. `current` son
// las fotos que ya cuentan para el límite (publicadas + las que ya eligió).
// Sin recortar en silencio: si no entran todas, no se agrega ninguna y se
// dice cuántas hay que borrar.
export function checkNewPhotos(files: File[], current: number): { accepted: File[]; error: string | null } {
  const valid = files.filter(f => ALLOWED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_IMAGE_BYTES)
  const rejected = files.length - valid.length
  if (current + valid.length > MAX_PHOTOS) {
    const extra = current + valid.length - MAX_PHOTOS
    return {
      accepted: [],
      error: `El límite es ${MAX_PHOTOS} fotos por lugar. Tenés ${current} y querés agregar ${valid.length}: borrá al menos ${extra} para poder subirlas.`,
    }
  }
  return {
    accepted: valid,
    error: rejected > 0
      ? `${rejected} archivo${rejected !== 1 ? "s" : ""} no se pudo agregar: solo se aceptan imágenes (JPG, PNG, WEBP, GIF, HEIC) de hasta 15MB.`
      : null,
  }
}

export function errorMessage(e: unknown, fallback: string) {
  // El detail de un 422 de FastAPI es una lista de errores de validación,
  // no un texto para mostrar.
  if (e instanceof ApiError && e.status !== 422 && typeof e.message === "string" && e.message) return e.message
  return fallback
}

// Camping, Glamping y Motorhome: los lugares que tienen experiencias (lo
// que ofrece agregar-lugar y lo que muestra la página pública).
export const STAY_CATEGORIES = ["Camping", "Glamping", "Motorhome"]

export function isStaySpot(categoryName: string | null | undefined) {
  return !!categoryName && STAY_CATEGORIES.includes(categoryName)
}

// El precio del lugar solo se muestra en Camping y Motorhome (por noche;
// lib/spotCard.ts). En Glamping va en cada alojamiento. En el resto no hay
// precio propio: antes el panel lo pedía igual y nunca se veía.
export type PriceMode = "own" | "glamping" | "none"

export function priceMode(activities: string[]): PriceMode {
  if (activities.includes("Camping") || activities.includes("Motorhome")) return "own"
  if (activities.includes("Glamping")) return "glamping"
  return "none"
}

// Nombre de la pestaña de contenido del dashboard según el tipo de lugar
// (qué se le puede sumar). null = el lugar no tiene esa pestaña.
export function contentTabLabel(categoryName: string | null | undefined, hasGlamping: boolean): string | null {
  if (isStaySpot(categoryName)) return hasGlamping ? "🧭 Experiencias y alojamiento" : "🧭 Experiencias"
  switch (categoryName) {
    case "Trekking": return "🥾 Rutas"
    case "Escalada": return "🧗 Sectores y vías"
    case "Surf": return "🏄 Escuelas de surf"
    case "Kayak": return "🛶 Kayak"
    default: return null
  }
}
