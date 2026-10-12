"use client"

// "Escuelas y servicios": todas las escuelas de surf y servicios de kayak
// (GET /admin/operators). Antes no había dónde verlos: solo aparecían si
// alguien los reportaba o pedía un cambio. Editar lleva a su panel (el
// admin puede, como el dueño); eliminar, como desde un reporte.
import { useEffect, useState } from "react"
import Pill from "@/components/ui/Pill"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { api, ApiError } from "@/lib/api"
import { slugWithId } from "@/lib/slugify"
import { input, pill } from "@/lib/theme"

export type AdminOperator = {
  kind: "surf_school" | "kayak"
  id: number
  name: string
  spot: { id: number; name: string; department: string }
  owner_email: string | null
  is_approved: boolean
  photos: number
  has_description: boolean
  review_count: number
  average_rating: number | null
}

const KIND = {
  surf_school: { label: "🏄 Escuela de surf", path: "surf", api: "surfschool" },
  kayak: { label: "🛶 Kayak", path: "kayak", api: "kayak" },
} as const

type KindFilter = "all" | AdminOperator["kind"]

export default function OperatorsTab({ token }: { token: string | undefined }) {
  const [operators, setOperators] = useState<AdminOperator[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [kind, setKind] = useState<KindFilter>("all")
  const [deleting, setDeleting] = useState<AdminOperator | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api.get<AdminOperator[]>("/admin/operators", { token })
      .then(({ data }) => setOperators(data))
      .catch(() => setLoadError("No se pudieron cargar las escuelas y servicios."))
  }, [token])

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await api.del(`/${KIND[deleting.kind].api}/${deleting.id}`, { token })
      setOperators(prev => prev?.filter(o => !(o.kind === deleting.kind && o.id === deleting.id)) ?? null)
      setDeleting(null)
    } catch (e) {
      setDeleteError(e instanceof ApiError && e.status >= 400 && e.status < 500 ? e.message : "No se pudo eliminar. Intentá de nuevo.")
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loadError) return <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>{loadError}</p>
  if (!operators) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</p>

  const q = search.trim().toLowerCase()
  const shown = operators.filter(o =>
    (kind === "all" || o.kind === kind) &&
    (!q || [o.name, o.spot.name, o.spot.department, o.owner_email ?? ""].some(v => v?.toLowerCase().includes(q)))
  )
  const countOf = (k: KindFilter) => operators.filter(o => k === "all" || o.kind === k).length

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {(["all", "surf_school", "kayak"] as const).map(k => (
          <button key={k} onClick={() => setKind(k)} style={pill(kind === k)}>
            {k === "all" ? "Todos" : k === "surf_school" ? "Surf" : "Kayak"} ({countOf(k)})
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="Buscar por nombre, playa, departamento o dueño..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...input, marginBottom: 14 }}
      />

      {shown.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>{operators.length === 0 ? "Todavía no hay escuelas ni servicios." : "No hay resultados."}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shown.map(o => (
            <div key={`${o.kind}-${o.id}`} className="spot-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>{o.name}</span>
                  <Pill variant="beige" size="sm">{KIND[o.kind].label}</Pill>
                  <Pill variant={o.is_approved ? "green" : "yellow"} size="sm">{o.is_approved ? "Publicado" : "En revisión"}</Pill>
                </div>
                <p style={{ fontSize: 12, color: "var(--muted-strong)", margin: 0 }}>en {o.spot.name} · {o.spot.department}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap", fontSize: 11, color: "var(--muted)" }}>
                  <span>📷 {o.photos} foto{o.photos !== 1 ? "s" : ""}</span>
                  <span>⭐ {o.average_rating ?? "–"} ({o.review_count})</span>
                  {!o.has_description && <span style={{ color: "#78590a" }}>Sin descripción</span>}
                  {o.owner_email
                    ? <a href={`mailto:${o.owner_email}`} style={{ color: "var(--primary)", textDecoration: "none" }}>✉️ {o.owner_email}</a>
                    : <span>Sin dueño</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {o.is_approved && (
                  <a href={`/${KIND[o.kind].path}/${slugWithId(o.name, o.id)}`} target="_blank" rel="noopener noreferrer"
                    className="action-btn-sm" style={{ background: "#fff", color: "#3d3d3a", border: "1px solid var(--border)", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                    Ver
                  </a>
                )}
                <a href={`/dashboard/operadores/${o.kind}/${o.id}`}
                  className="action-btn-sm" style={{ background: "#fff", color: "#3d3d3a", border: "1px solid var(--border)", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                  Editar
                </a>
                <button onClick={() => { setDeleteError(null); setDeleting(o) }}
                  className="action-btn-sm" style={{ background: "#fff", color: "var(--danger)", border: "1px solid #fecaca" }}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={deleting !== null}
        title={`¿Eliminar «${deleting?.name ?? ""}»?`}
        message="Se borra con sus fotos y reseñas. No se puede deshacer."
        confirmPhrase="CONFIRMAR"
        loading={deleteLoading}
        error={deleteError}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
