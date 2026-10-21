// La navegación del panel de admin y las cuentas que hace la página con la
// lista de lugares (sin estado: se prueban sueltas en adminNav.test.ts).
import { spotStatus, type AdminMode, type AdminSpot, type SortBy, type SpotFilter } from "./types"
import type { SidebarGroup } from "./AdminSidebar"
import type { AdminSummary } from "./SummaryTab"

export const TAB_GROUPS: SidebarGroup[] = [
  { title: "Por revisar", tabs: [
    { id: "nuevos", label: "🆕 Lugares nuevos" },
    { id: "cambios", label: "📝 Cambios y aportes" },
    { id: "reportes", label: "⚑ Reportes" },
    { id: "reclamos", label: "🙋 Responsables" },
  ] },
  { title: "Gestión", tabs: [
    { id: "lugares", label: "🗺️ Lugares" },
    { id: "fotos", label: "📷 Fotos" },
    { id: "importar-vias", label: "📥 Importar vías" },
    { id: "cuentas-eliminadas", label: "👤 Cuentas eliminadas" },
  ] },
]

// El título de la página: la sección en la que se está, sin el emoji.
export function sectionTitle(mode: AdminMode, groups: SidebarGroup[] = TAB_GROUPS): string {
  if (mode === "resumen") return "Resumen"
  const label = groups.flatMap(g => g.tabs).find(t => t.id === mode)?.label ?? "Panel de administración"
  return label.replace(/^\S+\s/, "")
}

// Qué listas necesita cada pestaña (se piden recién al abrirla).
export function listsFor(mode: AdminMode) {
  return {
    spots: mode === "nuevos" || mode === "lugares" || mode === "fotos" || mode === "importar-vias" || mode === "cuentas-eliminadas",
    cambios: mode === "cambios", reportes: mode === "reportes", reclamos: mode === "reclamos",
  }
}

// Los lugares cuyo dueño borró la cuenta no van en la gestión normal: viven
// aparte, en "Cuentas eliminadas" (los más viejos primero).
export function splitByOwner(spots: AdminSpot[]) {
  const active = spots.filter(s => !s.owner_deleted_at)
  const deactivated = spots
    .filter(s => s.owner_deleted_at)
    .sort((a, b) => new Date(a.owner_deleted_at!).getTime() - new Date(b.owner_deleted_at!).getTime())
  return { active, deactivated }
}

// La lista de "Lugares nuevos" / "Lugares": filtro por estado, búsqueda
// (nombre, departamento, categoría o email del dueño) y orden.
export function visibleSpots(spots: AdminSpot[], filter: SpotFilter, search: string, sortBy: SortBy): AdminSpot[] {
  const q = search.toLowerCase()
  return spots
    .filter(s => filter === "all" ? true : spotStatus(s) === filter)
    .filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      s.category?.name?.toLowerCase().includes(q) ||
      s.owner_email?.toLowerCase().includes(q)
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "category") return (a.category?.name ?? "").localeCompare(b.category?.name ?? "")
      if (sortBy === "department") return (a.department ?? "").localeCompare(b.department ?? "")
      if (sortBy === "date_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === "date_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return 0
    })
}

// Contadores de las pestañas: el de la lista si ya se cargó; si no, el del
// resumen (GET /admin/summary).
export function tabCounts(summary: AdminSummary | null, lists: {
  spots: { loaded: boolean; pending: number; deactivated: number }
  cambios: { loaded: boolean; count: number }
  reportes: { loaded: boolean; count: number }
  reclamos: { loaded: boolean; count: number }
}): Partial<Record<AdminMode, number | undefined>> {
  const q = summary?.queues
  return {
    nuevos: lists.spots.loaded ? lists.spots.pending : q?.new_spots.count,
    cambios: lists.cambios.loaded ? lists.cambios.count : q && q.changes.count + q.contributions.count,
    reportes: lists.reportes.loaded ? lists.reportes.count : q?.reports.count,
    reclamos: lists.reclamos.loaded ? lists.reclamos.count : q?.claims.count,
    "cuentas-eliminadas": lists.spots.loaded ? lists.spots.deactivated : undefined,
  }
}
