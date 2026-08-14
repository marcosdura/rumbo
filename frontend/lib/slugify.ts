// Réplica en JS de generate_slug() en backend/routers/spots.py — usada acá
// solo como prefijo cosmético para URLs de surf/kayak (/surf/nombre-id), no
// se persiste en ningún lado. La unicidad real la da el id, no este texto.
export function slugify(name: string): string {
  let slug = name.toLowerCase().trim()
  slug = slug.replace(/[áàäâ]/g, "a")
  slug = slug.replace(/[éèëê]/g, "e")
  slug = slug.replace(/[íìïî]/g, "i")
  slug = slug.replace(/[óòöô]/g, "o")
  slug = slug.replace(/[úùüû]/g, "u")
  slug = slug.replace(/[ñ]/g, "n")
  slug = slug.replace(/[^a-z0-9\s-]/g, "")
  slug = slug.replace(/\s+/g, "-")
  slug = slug.replace(/-+/g, "-")
  return slug.replace(/^-+|-+$/g, "")
}

// Slug compuesto para surf/kayak: texto cosmético + id al final, separados
// por guion (ej. "playa-grande-42"). El id garantiza unicidad sin tocar la
// base de datos — mismo patrón que Airbnb/Booking.
export function slugWithId(name: string, id: number): string {
  const base = slugify(name)
  return base ? `${base}-${id}` : String(id)
}

// Extrae el id numérico de un slug compuesto ("playa-grande-42" -> 42).
// También acepta un id "pelado" ("42" -> 42), así las URLs viejas
// puramente numéricas (indexadas antes de este cambio) siguen andando.
export function idFromSlug(slug: string): number | null {
  const match = slug.match(/(\d+)$/)
  return match ? parseInt(match[1], 10) : null
}
