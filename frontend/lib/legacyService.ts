import { notFound, permanentRedirect } from "next/navigation"
import { api } from "@/lib/api"
import { nullIfNotFound } from "@/lib/notFound"
import { idFromSlug } from "@/lib/slugify"

// Las escuelas de surf y los servicios de kayak ahora son lugares: sus
// direcciones viejas (/surf/<nombre>-<id>, /kayak/<nombre>-<id>) llevan al
// lugar con una redirección permanente (Google pasa lo ganado a la nueva).
// Si no hay lugar, 404; si falló la API, el error sigue hasta app/error.tsx.
export async function redirectToSpot(kind: "surf" | "kayak", slug: string): Promise<never> {
  const id = idFromSlug(slug)
  if (id === null) notFound()
  const found = await nullIfNotFound(api.get<{ slug: string }>(`/spots/legacy/${kind}/${id}`))
  if (!found) notFound()
  permanentRedirect(`/spots/${found.data.slug}`)
}
