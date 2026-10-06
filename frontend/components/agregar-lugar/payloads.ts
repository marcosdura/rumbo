// Cómo se arma lo que se manda al backend para una experiencia o una unidad
// de glamping. Lo usan agregar-lugar (al crear el lugar) y el dashboard del
// dueño (al sumarlas a un lugar existente): así las dos pantallas mandan lo
// mismo.
import { EXPERIENCE_SCHEDULE_OPTIONS } from "./constants"
import type { ExperienceItem, GlampingDetailItem } from "./types"

// null si la experiencia está incompleta (sin título o sin categoría).
export function experiencePayload(exp: ExperienceItem) {
  if (!exp.title.trim() || !exp.category_id) return null
  const schedule = exp.schedule_type === "personalizado"
    ? exp.schedule_custom.trim() || null
    : exp.schedule_type
      ? EXPERIENCE_SCHEDULE_OPTIONS.find(o => o.value === exp.schedule_type)?.label ?? null
      : null
  return {
    category_id: parseInt(exp.category_id),
    title: exp.title.trim(),
    description: exp.description.trim() || null,
    price: exp.price ? parseFloat(exp.price) : null,
    currency: "UYU",
    schedule,
    contact: exp.contact.trim() || null,
  }
}

export function glampingUnitPayload(unit: GlampingDetailItem) {
  return {
    accommodation_type: unit.accommodation_type || null,
    capacity: unit.capacity ? parseInt(unit.capacity) : null,
    price_per_night: unit.price_per_night ? parseFloat(unit.price_per_night) : null,
    min_nights: unit.min_nights ? parseInt(unit.min_nights) : null,
  }
}

// Los cuatro campos son obligatorios (mínimo de noches puede ser 0).
export function missingGlampingFields(unit: GlampingDetailItem): Set<keyof GlampingDetailItem> {
  const missing = new Set<keyof GlampingDetailItem>()
  if (!unit.accommodation_type) missing.add("accommodation_type")
  if (!unit.capacity) missing.add("capacity")
  if (!unit.price_per_night) missing.add("price_per_night")
  if (!unit.min_nights) missing.add("min_nights")
  return missing
}
