import type { ChangeRequest } from "./types"

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
