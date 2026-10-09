// "hace 3 días" (las fechas del backend vienen sin zona: son UTC). Lo usan
// las reseñas de cada página y "Mis reseñas".
export function timeAgo(dateStr: string, now = Date.now()): string {
  const iso = /Z|[+-]\d\d:\d\d$/.test(dateStr) ? dateStr : `${dateStr}Z`
  const diff = now - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins} min`
  if (hours < 24) return `hace ${hours} h`
  if (days < 30) return `hace ${days} día${days !== 1 ? "s" : ""}`
  return new Date(iso).toLocaleDateString("es-UY", { month: "short", year: "numeric" })
}
