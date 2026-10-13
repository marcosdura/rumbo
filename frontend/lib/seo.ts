// Lo común del SEO: títulos, descripciones, imagen por defecto al compartir
// y las "migas de pan" (BreadcrumbList) que Google muestra en los resultados.
import { SITE_URL } from "@/lib/site"

const MAX_DESCRIPTION = 160

// Sin espacios de más: había nombres guardados con un espacio al final y el
// título salía "Sendero Norte  | Rumbo".
export function cleanText(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim()
}

export function pageTitle(name: string | null | undefined): string {
  const clean = cleanText(name)
  return clean ? `${clean} | Rumbo` : "Rumbo"
}

// Google corta el título más o menos ahí.
const MAX_TITLE = 60
const fold = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

// "Camping Santa Teresa — Rocha | Rumbo", "Cerro Arequita — Trekking en
// Lavalleja | Rumbo": lo que la gente busca ("camping en Rocha") queda en el
// título. Si el nombre ya dice la actividad (`keyword`) no se repite. Si no
// entra, se saca primero el lugar y después la actividad.
export function richTitle(
  name: string | null | undefined,
  { activity, keyword, place }: { activity?: string | null; keyword?: string | null; place?: string | null },
): string {
  const clean = cleanText(name)
  if (!clean) return "Rumbo"
  const where = cleanText(place)
  const said = !!keyword && fold(clean).includes(fold(keyword))
  const what = said ? "" : cleanText(activity)
  const candidates = [
    what && where ? `${what} en ${where}` : what || where,
    what,
  ]
  for (const extra of candidates) {
    const title = extra ? `${clean} — ${extra} | Rumbo` : ""
    if (title && title.length <= MAX_TITLE) return title
  }
  return pageTitle(clean)
}

// Qué es un lugar, para el título: la escuela de surf o el servicio de
// kayak se distinguen de la playa o la laguna.
export function spotTitle(spot: {
  name: string; department?: string | null; category?: unknown
  surf_detail?: unknown; kayak_service_detail?: unknown
}): string {
  const category = (spot.category as { name?: string } | null | undefined)?.name ?? null
  const activity = category === "Surf" && spot.surf_detail ? "Escuela de surf" : category
  return richTitle(spot.name, { activity, keyword: category, place: spot.department })
}

// Hasta 160 caracteres, cortando en una palabra completa con "…". Antes se
// cortaba a la mitad de una palabra ("uno de los puntos más frec").
export function metaDescription(text: string | null | undefined, max = MAX_DESCRIPTION): string {
  const clean = cleanText(text)
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.]+$/, "")}…`
}

// Para un lugar sin descripción (si no, Google no tiene nada que mostrar).
export function spotFallbackDescription(spot: { name: string; department?: string | null; categories?: unknown }): string {
  const names = Array.isArray(spot.categories)
    ? (spot.categories as { name?: string }[]).map(c => c.name).filter(Boolean) as string[]
    : []
  const what = names.length ? names.join(", ") : "Lugar al aire libre"
  const where = spot.department ? ` en ${spot.department}` : " en Uruguay"
  return `${cleanText(spot.name)}: ${what}${where}. Información práctica, fotos y reseñas en Rumbo.`
}

// La imagen al compartir: la foto que haya o, si no, la de Rumbo
// (app/opengraph-image.tsx). Antes un lugar sin fotos salía sin imagen.
export const DEFAULT_SHARE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "Rumbo" }
export function shareImages(url: string | null | undefined) {
  return [url ? { url, width: 1200, height: 630 } : DEFAULT_SHARE_IMAGE]
}

// Lo que va en openGraph y twitter de una página de detalle.
export function socialMetadata({ title, description, path, image }: {
  title: string; description: string; path: string; image?: string | null
}) {
  const images = shareImages(image)
  return {
    alternates: { canonical: path },
    openGraph: { title, description, url: path, images, type: "website" as const, siteName: "Rumbo", locale: "es_UY" },
    twitter: { card: "summary_large_image" as const, title, description, images: images.map(i => i.url) },
  }
}

// Migas de pan: Inicio › ... › esta página.
export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Inicio", path: "/" }, ...items].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: cleanText(item.name),
      item: `${SITE_URL}${item.path}`,
    })),
  }
}

// Para Google: qué sitio es y de quién (el logo y el Instagram).
export const SITE_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Rumbo",
    url: `${SITE_URL}/`,
    inLanguage: "es-UY",
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rumbo",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/RumboLogo.png`,
    sameAs: ["https://www.instagram.com/rumbo.app/"],
  },
]

// Una ruta de trekking o un sector de escalada: un atractivo dentro de su lugar.
export function trailJsonLd({ name, description, path, image, spot }: {
  name: string; description: string; path: string; image?: string | null
  spot: { name: string; slug: string; department: string | null }
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: cleanText(name),
    description,
    url: `${SITE_URL}${path}`,
    ...(image ? { image } : {}),
    containedInPlace: {
      "@type": "Place",
      name: cleanText(spot.name),
      url: `${SITE_URL}/spots/${spot.slug}`,
      ...(spot.department ? { address: { "@type": "PostalAddress", addressRegion: spot.department, addressCountry: "UY" } } : {}),
    },
  }
}

// Páginas de la cuenta y del admin: con título, pero fuera de Google.
export function privateMetadata(title: string) {
  return { title: pageTitle(title), robots: { index: false, follow: false } }
}

// Las secciones con privateMetadata (app/<sección>/layout.tsx): robots.txt
// también las bloquea.
export const PRIVATE_SECTIONS = ["/admin", "/dashboard", "/profile", "/favorites", "/reviews", "/notificaciones", "/agregar-lugar"]
