// /profile: el resumen de arriba y las filas del menú, a partir de
// GET /me/summary (backend/routers/me.py).

export type ProfileSummary = {
  member_since: string | null
  favorites: number
  reviews: number
  managed: number
  managed_rejected: number
  suggested: number
  contributions: number
  contributions_pending: number
  requests: number
  requests_pending: number
}

// Si no se pudo cargar el resumen, el menú se muestra igual, sin números.
export const EMPTY_SUMMARY: ProfileSummary = {
  member_since: null, favorites: 0, reviews: 0, managed: 0, managed_rejected: 0, suggested: 0,
  contributions: 0, contributions_pending: 0, requests: 0, requests_pending: 0,
}

export type MenuBadge = { variant: "red" | "yellow"; text: string }

export type ProfileMenuRow = {
  href: string
  icon: string
  title: string
  // Qué hay ahí (con 0 explica para qué sirve la sección).
  hint: string
  count: number
  // Lo que pide atención: algo rechazado o en revisión.
  badge: MenuBadge | null
}

// "octubre de 2026"
export function memberSince(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("es-UY", { month: "long", year: "numeric" })
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

// "8 favoritos · 12 reseñas · 3 lugares": solo lo que tiene algo.
export function summaryLine(s: ProfileSummary): string | null {
  const parts = [
    s.favorites && plural(s.favorites, "favorito", "favoritos"),
    s.reviews && plural(s.reviews, "reseña", "reseñas"),
    s.managed + s.suggested && plural(s.managed + s.suggested, "lugar", "lugares"),
    s.contributions && plural(s.contributions, "aporte", "aportes"),
  ].filter(Boolean)
  return parts.length ? parts.join(" · ") : null
}

export function menuRows(s: ProfileSummary): ProfileMenuRow[] {
  const places = s.managed + s.suggested
  return [
    {
      href: "/favorites", icon: "❤️", title: "Favoritos", count: s.favorites, badge: null,
      hint: s.favorites ? "Los lugares que guardaste" : "Guardá lugares con el ❤️ para encontrarlos acá",
    },
    {
      href: "/reviews", icon: "💬", title: "Mis reseñas", count: s.reviews, badge: null,
      hint: s.reviews ? "Lo que opinaste de los lugares" : "Todavía no escribiste reseñas",
    },
    {
      href: "/profile/lugares", icon: "🏕️", title: "Lugares que administrás", count: places,
      badge: s.managed_rejected ? { variant: "red", text: plural(s.managed_rejected, "rechazado", "rechazados") } : null,
      hint: places ? "Tus lugares, tus escuelas y los que sugeriste" : "Todavía no cargaste ningún lugar",
    },
    {
      href: "/profile/aportes", icon: "➕", title: "Mis aportes", count: s.contributions,
      badge: s.contributions_pending ? { variant: "yellow", text: `${s.contributions_pending} en revisión` } : null,
      hint: s.contributions ? "Lo que sumaste a lugares publicados" : "Sectores, vías, rutas y más que sumes a un lugar",
    },
    {
      href: "/profile/pedidos", icon: "📝", title: "Mis pedidos", count: s.requests,
      badge: s.requests_pending ? { variant: "yellow", text: `${s.requests_pending} en revisión` } : null,
      hint: s.requests ? "Cambios en tus lugares y pedidos para hacerte cargo" : "Cambios en tus lugares y pedidos para hacerte cargo de uno",
    },
  ]
}
