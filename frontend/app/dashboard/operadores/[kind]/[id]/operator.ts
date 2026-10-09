// Dashboard de una escuela de surf o un servicio de kayak (backend/operators.py).
import type { ChangeRequest } from "@/app/dashboard/spots/[id]/types"
import { joinLabels } from "@/app/dashboard/spots/[id]/changes"

export type OperatorKind = "surf_school" | "kayak"

export const OPERATOR_KINDS: OperatorKind[] = ["surf_school", "kayak"]

export const OPERATOR_LABELS: Record<OperatorKind, string> = {
  surf_school: "Escuela de surf",
  kayak: "Servicio de kayak",
}

export type OperatorChange = {
  id: number
  status: "pending" | "approved" | "rejected" | "cancelled"
  changes: {
    name?: { from: string; to: string }
    description?: { from: string | null; to: string | null }
    photos?: { from: string[]; to: string[] }
  }
  reject_reason: string | null
  created_at: string | null
  resolved_at: string | null
}

export type Operator = {
  id: number
  kind: OperatorKind
  name: string
  is_approved: boolean
  spot: { id: number; name: string; slug: string | null; is_approved: boolean }
  contribution_id: number | null
  change_request: OperatorChange | null
  photo_1: string | null; photo_2: string | null; photo_3: string | null
  duration: number | null
  description?: string | null; price_from?: number | null; price_note?: string | null
  email: string | null; whatsapp: string | null; instagram: string | null
  season_start: number | null; season_end: number | null
  // Escuela de surf
  class_type?: string | null; equipment_include?: boolean | null
  levels?: string[] | null; languages?: string[] | null
  // Kayak
  water_type?: string | null; difficulty?: string | null; kayak_type?: string | null; rental_available?: boolean | null
  includes_guide?: boolean | null; includes_life_jacket?: boolean | null
}

export type OperatorForm = {
  name: string
  description: string; price_from: string; price_note: string
  duration: string
  email: string; whatsapp: string; instagram: string
  seasonal: boolean; season_start: string; season_end: string
  class_type: string; equipment_include: boolean | null
  // null = no sé.
  levels: string[] | null; languages: string[] | null
  water_type: string; difficulty: string; kayak_type: string; rental_available: boolean | null
  includes_guide: boolean | null; includes_life_jacket: boolean | null
}

export function formFromOperator(op: Operator): OperatorForm {
  return {
    name: op.name ?? "",
    description: op.description ?? "",
    price_from: op.price_from != null ? String(op.price_from) : "",
    price_note: op.price_note ?? "",
    duration: op.duration != null ? String(op.duration) : "",
    email: op.email ?? "", whatsapp: op.whatsapp ?? "", instagram: op.instagram ?? "",
    seasonal: !!op.season_start,
    season_start: op.season_start ? String(op.season_start) : "",
    season_end: op.season_end ? String(op.season_end) : "",
    class_type: op.class_type ?? "", equipment_include: op.equipment_include ?? null,
    levels: op.levels ?? null, languages: op.languages ?? null,
    water_type: op.water_type ?? "", difficulty: op.difficulty ?? "", kayak_type: op.kayak_type ?? "",
    rental_available: op.rental_available ?? null,
    includes_guide: op.includes_guide ?? null, includes_life_jacket: op.includes_life_jacket ?? null,
  }
}

export function photosOf(op: Operator): string[] {
  return [op.photo_1, op.photo_2, op.photo_3].filter((p): p is string => !!p)
}

// Lo que se manda a PATCH /operators/{kind}/{id}: solo los campos del tipo.
export function operatorPayload(kind: OperatorKind, form: OperatorForm, photos: string[]) {
  const common = {
    name: form.name,
    description: form.description.trim() || null,
    price_from: form.price_from !== "" ? parseInt(form.price_from) : null,
    price_note: form.price_note.trim() || null,
    duration: form.duration !== "" ? parseFloat(form.duration) : null,
    email: form.email || null,
    whatsapp: form.whatsapp || null,
    instagram: form.instagram || null,
    season_start: form.seasonal && form.season_start ? parseInt(form.season_start) : null,
    season_end: form.seasonal && form.season_end ? parseInt(form.season_end) : null,
    photos,
  }
  return kind === "surf_school"
    ? {
      ...common, class_type: form.class_type || null, equipment_include: form.equipment_include,
      levels: form.levels, languages: form.languages,
    }
    : {
      ...common,
      water_type: form.water_type || null, difficulty: form.difficulty || null,
      kayak_type: form.kayak_type || null, rental_available: form.rental_available,
      includes_guide: form.includes_guide, includes_life_jacket: form.includes_life_jacket,
    }
}

const FIELD_LABELS: Record<string, string> = {
  name: "nombre", description: "descripción", price_from: "precio", price_note: "precio", photos: "fotos", class_type: "tipo de clase", duration: "duración",
  equipment_include: "equipo incluido", water_type: "tipo de agua", difficulty: "dificultad",
  kayak_type: "tipo de kayak", rental_available: "alquiler", email: "email", whatsapp: "WhatsApp",
  levels: "niveles", languages: "idiomas", includes_guide: "guía", includes_life_jacket: "chaleco",
  instagram: "Instagram", season_start: "temporada", season_end: "temporada",
}

// "nombre y fotos"
export function describeOperatorFields(fields: string[]) {
  const labels: string[] = []
  for (const f of fields) {
    const label = FIELD_LABELS[f]
    if (label && !labels.includes(label)) labels.push(label)
  }
  return joinLabels(labels)
}

// El aviso del dashboard de spots (ChangeRequestBanner) sabe mostrar nombre y
// fotos nuevas: se le pasa el pedido del operador con esa forma.
export function asSpotChangeRequest(change: OperatorChange): ChangeRequest {
  const photos = change.changes.photos
  const added = photos ? photos.to.filter(p => !photos.from.includes(p)) : []
  return {
    id: change.id,
    status: change.status,
    reject_reason: change.reject_reason,
    created_at: change.created_at,
    resolved_at: change.resolved_at,
    changes: {
      ...(change.changes.name ? { name: change.changes.name } : {}),
      ...(change.changes.description ? { description: { from: change.changes.description.from ?? "", to: change.changes.description.to ?? "" } } : {}),
      ...(added.length ? { photos_added: added } : {}),
    },
  }
}
