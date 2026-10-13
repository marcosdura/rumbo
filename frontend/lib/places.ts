// Las páginas /lugares/...: "Camping en Uruguay" (/lugares/camping),
// "Lugares en Rocha" (/lugares/rocha) y "Camping en Rocha"
// (/lugares/camping/rocha). Se arman en el servidor para que Google las vea
// con los lugares adentro (la búsqueda se arma en el navegador y le llegaba
// vacía). Los nombres de actividad son los mismos que filtra GET /spots.
import { DEPARTMENTS } from "@/components/agregar-lugar/constants"
import { slugify } from "@/lib/slugify"
import { SITE_URL } from "@/lib/site"
import { breadcrumb, socialMetadata } from "@/lib/seo"

export type Activity = { slug: string; name: string; emoji: string; intro: string }

export const ACTIVITIES: Activity[] = [
  { slug: "camping", name: "Camping", emoji: "🏕️", intro: "Campings para armar la carpa: con baños, parrilleros, agua potable o a pura naturaleza." },
  { slug: "glamping", name: "Glamping", emoji: "🛖", intro: "Domos, cabañas y carpas equipadas para dormir en la naturaleza con comodidad." },
  { slug: "trekking", name: "Trekking", emoji: "🥾", intro: "Senderos y cerros para caminar, con la distancia, la dificultad y el recorrido de cada ruta." },
  { slug: "escalada", name: "Escalada", emoji: "🧗", intro: "Lugares para escalar, con sus sectores y vías: grado, tipo de roca y cómo llegar." },
  { slug: "surf", name: "Surf", emoji: "🏄", intro: "Playas para surfear y escuelas de surf con clases para todos los niveles." },
  { slug: "kayak", name: "Kayak", emoji: "🛶", intro: "Lagunas, ríos y arroyos para remar, y servicios de kayak con alquiler o salidas guiadas." },
  { slug: "motorhome", name: "Motorhome", emoji: "🚐", intro: "Lugares para parar con motorhome o camper: dónde estacionar, cargar agua y descargar." },
]

export type Department = { slug: string; name: string }

export const DEPARTMENT_LIST: Department[] = DEPARTMENTS.map(name => ({ slug: slugify(name), name }))

export const findActivity = (slug: string) => ACTIVITIES.find(a => a.slug === slug) ?? null
export const findDepartment = (slug: string) => DEPARTMENT_LIST.find(d => d.slug === slug) ?? null

// GET /sitemap/places: cuántos lugares publicados hay de cada actividad en
// cada departamento.
export type PlaceCount = { activity: string; department: string; count: number }

export function placesPath(activity: Activity | null, department: Department | null): string {
  return `/lugares/${[activity?.slug, department?.slug].filter(Boolean).join("/")}`
}

export function placesHeading(activity: Activity | null, department: Department | null): string {
  return `${activity ? activity.name : "Lugares"} en ${department ? department.name : "Uruguay"}`
}

// Los links desde otras páginas (el footer, las pills de un lugar), por
// nombre: la página de la actividad (en ese departamento, si se sabe) o la
// del departamento. Con un nombre que no conocemos, la búsqueda.
export function activityHref(name: string, departmentName?: string | null): string {
  const activity = ACTIVITIES.find(a => a.name === name) ?? null
  const department = DEPARTMENT_LIST.find(d => d.name === departmentName) ?? null
  return activity ? placesPath(activity, department) : `/search?activity=${encodeURIComponent(name)}`
}

export function departmentHref(name: string): string {
  const department = DEPARTMENT_LIST.find(d => d.name === name)
  return department ? placesPath(null, department) : `/search?department=${encodeURIComponent(name)}`
}

// Lo mismo, en el buscador (para seguir filtrando y ver el mapa).
export function searchPath(activity: Activity | null, department: Department | null): string {
  const params = new URLSearchParams()
  if (activity) params.set("activity", activity.name)
  if (department) params.set("department", department.name)
  const query = params.toString()
  return query ? `/search?${query}` : "/search"
}

// Los departamentos con lugares de esa actividad, y las actividades que hay
// en un departamento, con cuántos lugares cada uno. Sin actividad, solo
// sirve para saber qué departamentos tienen lugares (un lugar con dos
// actividades está en dos filas: `count` es un mínimo, no el total).
export function departmentsWith(counts: PlaceCount[], activity: Activity | null): (Department & { count: number })[] {
  return DEPARTMENT_LIST
    .map(d => ({
      ...d,
      count: activity
        ? counts.find(c => c.activity === activity.name && c.department === d.name)?.count ?? 0
        : Math.max(0, ...counts.filter(c => c.department === d.name).map(c => c.count)),
    }))
    .filter(d => d.count > 0)
}

export function activitiesIn(counts: PlaceCount[], department: Department): (Activity & { count: number })[] {
  return ACTIVITIES
    .map(a => ({ ...a, count: counts.find(c => c.activity === a.name && c.department === department.name)?.count ?? 0 }))
    .filter(a => a.count > 0)
}

// Todas las páginas que tienen lugares, para el sitemap. Las de actividad
// van siempre (son pocas y fijas).
export function placesPaths(counts: PlaceCount[]): string[] {
  const paths = ACTIVITIES.map(a => placesPath(a, null))
  for (const d of departmentsWith(counts, null)) paths.push(placesPath(null, d))
  for (const a of ACTIVITIES) {
    for (const d of departmentsWith(counts, a)) paths.push(placesPath(a, d))
  }
  return paths
}

export function placesDescription(activity: Activity | null, department: Department | null): string {
  const heading = placesHeading(activity, department)
  if (activity) return `${heading}. ${activity.intro} Con fotos, reseñas y cómo llegar.`
  return `${heading}: lugares al aire libre para acampar, caminar, escalar, surfear o remar, con fotos, reseñas y cómo llegar.`
}

export function placesMetadata(activity: Activity | null, department: Department | null) {
  const title = `${placesHeading(activity, department)} | Rumbo`
  const description = placesDescription(activity, department)
  return { title, description, ...socialMetadata({ title, description, path: placesPath(activity, department) }) }
}

// Migas de pan (Inicio › Camping en Uruguay › Camping en Rocha) y la lista de
// lugares, para Google.
export function placesJsonLd(activity: Activity | null, department: Department | null, spots: { name: string; slug?: string | null }[]) {
  const crumbs = [
    ...(activity && department ? [{ name: placesHeading(activity, null), path: placesPath(activity, null) }] : []),
    { name: placesHeading(activity, department), path: placesPath(activity, department) },
  ]
  return [
    breadcrumb(crumbs),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: placesHeading(activity, department),
      itemListElement: spots.filter(s => s.slug).map((s, i) => ({
        "@type": "ListItem", position: i + 1, name: s.name, url: `${SITE_URL}/spots/${s.slug}`,
      })),
    },
  ]
}

// La búsqueda: título según el filtro (antes todas decían lo mismo) y fuera
// de Google, que igual sigue sus links. Lo que Google tiene que encontrar son
// las páginas /lugares/..., que muestran los lugares en el HTML.
export function searchMetadata(params: Record<string, string | string[] | undefined>) {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const activity = ACTIVITIES.find(a => a.name === one(params.activity)) ?? null
  const department = DEPARTMENT_LIST.find(d => d.name === one(params.department)) ?? null
  return {
    title: activity || department ? `Buscar: ${placesHeading(activity, department)} | Rumbo` : "Buscar lugares | Rumbo",
    robots: { index: false, follow: true },
  }
}
