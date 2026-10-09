// Notificaciones dentro de la app (backend/notifications.py): la campanita
// del Navbar y /notificaciones.

export type AppNotification = {
  id: number
  kind: string
  title: string
  body: string | null
  link: string | null
  created_at: string | null
  read: boolean
}

export type NotificationList = { unread: number; items: AppNotification[]; has_more?: boolean }

// "hace 3h": notificaciones, las reseñas de cada página y "Mis reseñas".
// Acepta fechas con o sin zona horaria: las de las reseñas vienen sin (UTC
// implícito), las de las notificaciones con.
export function timeAgo(dateStr: string | null, now: number = Date.now()): string {
  if (!dateStr) return ""
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(dateStr)
  const date = new Date(hasZone ? dateStr : `${dateStr}Z`)
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins} min`
  if (hours < 24) return `hace ${hours}h`
  if (days < 30) return `hace ${days} día${days !== 1 ? "s" : ""}`
  return date.toLocaleDateString("es-UY", { month: "short", year: "numeric" })
}

// Ícono según el tipo de aviso.
export function notificationIcon(kind: string): string {
  if (kind.endsWith("approved")) return "✅"
  if (kind.endsWith("rejected") || kind === "review_deleted") return "⚠️"
  if (kind === "new_review") return "⭐"
  if (kind === "spot_new_content") return "➕"
  if (kind.startsWith("admin_")) return "🛠️"
  return "🔔"
}

// "9+" a partir de 10, para que el globito no crezca.
export function badgeText(unread: number): string {
  return unread > 9 ? "9+" : String(unread)
}
