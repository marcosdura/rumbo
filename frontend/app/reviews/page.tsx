"use client"

// "Mis reseñas": las de lugares, escuelas de surf y servicios de kayak
// (antes solo las de lugares), con el mismo armazón que las otras páginas
// del menú del perfil. Cada una se edita o se borra acá.
import { useEffect, useState } from "react"
import Link from "next/link"
import { StarDisplay, StarPicker } from "@/components/ui/StarRating"
import ConfirmModal from "@/components/ui/ConfirmModal"
import ProfileSubpage from "@/app/profile/ProfileSubpage"
import { api } from "@/lib/api"
import { timeAgo } from "@/lib/notifications"
import type { MyReview } from "@/lib/types"

// A qué endpoint va cada una para editarla o borrarla.
const BASE: Record<MyReview["kind"], string> = { spot: "/reviews", surf: "/surf-reviews", kayak: "/kayak-reviews" }
const KIND_LABEL: Record<MyReview["kind"], string | null> = { spot: null, surf: "🏄 Escuela de surf", kayak: "🛶 Servicio de kayak" }

const key = (r: Pick<MyReview, "kind" | "id">) => `${r.kind}-${r.id}`

const button = {
  padding: "8px 16px", borderRadius: 12, fontSize: 13, fontFamily: "inherit", cursor: "pointer",
}

function MyReviews({ token, onCount }: { token: string; onCount: (n: number) => void }) {
  const [reviews, setReviews] = useState<MyReview[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<MyReview | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // Edición: la reseña abierta y sus campos.
  const [editing, setEditing] = useState<string | null>(null)
  const [editRating, setEditRating] = useState(0)
  const [editComment, setEditComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    api.get<MyReview[]>("/reviews/user/me", { token })
      .then(({ data }) => { setReviews(data); setLoadError(false); onCount(data.length) })
      // Antes el error se ignoraba y decía "Todavía no escribiste reseñas".
      .catch(() => setLoadError(true))
  }, [token, attempt, onCount])

  async function remove() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await api.del(`${BASE[deleteTarget.kind]}/${deleteTarget.id}`, { token })
      const next = (reviews ?? []).filter(r => key(r) !== key(deleteTarget))
      setReviews(next)
      onCount(next.length)
      setDeleteTarget(null)
    } catch {
      setDeleteError("No se pudo eliminar la reseña. Intentá de nuevo.")
    }
    setDeleting(false)
  }

  function startEditing(r: MyReview) {
    setEditing(key(r))
    setEditRating(r.rating)
    setEditComment(r.comment ?? "")
    setSaveError(false)
  }

  async function save(r: MyReview) {
    if (!editRating) return
    setSaving(true)
    setSaveError(false)
    try {
      const { data } = await api.patch<Pick<MyReview, "rating" | "comment" | "updated_at">>(
        `${BASE[r.kind]}/${r.id}`, { rating: editRating, comment: editComment }, { token },
      )
      setReviews(prev => prev?.map(x => (key(x) === key(r) ? { ...x, ...data } : x)) ?? null)
      setEditing(null)
    } catch {
      setSaveError(true)
    }
    setSaving(false)
  }

  if (loadError) {
    return (
      <div role="alert" style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px" }}>
        <p style={{ fontSize: 14, color: "var(--danger)", margin: "0 0 10px" }}>No se pudieron cargar tus reseñas.</p>
        <button type="button" onClick={() => { setLoadError(false); setAttempt(n => n + 1) }} style={{ ...button, background: "#fff", border: "1px solid var(--border)", color: "#3d3d3a" }}>
          Reintentar
        </button>
      </div>
    )
  }
  if (reviews === null) return <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>Cargando...</p>

  if (reviews.length === 0) {
    return (
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 20, padding: "48px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 40, margin: "0 0 12px", opacity: 0.25 }}>💬</p>
        <p style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 20, fontWeight: 600, color: "#1b1b19", margin: "0 0 6px" }}>
          Todavía no escribiste reseñas
        </p>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 20px", lineHeight: 1.6 }}>Visitá un lugar y contá tu experiencia.</p>
        <Link href="/search" style={{ display: "inline-flex", padding: "10px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600, background: "var(--primary-dark)", color: "#fff", textDecoration: "none" }}>
          Explorar lugares →
        </Link>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .my-review { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 18px 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .my-review-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .my-review-target { font-family: var(--font-playfair-display), serif; font-size: 17px; font-weight: 600; color: #1b1b19; text-decoration: none; }
        .my-review-target:hover { color: var(--primary); }
        .my-review-action { font-size: 12px; color: var(--muted); background: none; border: none; cursor: pointer; padding: 0; font-family: inherit; }
        .my-review-action:hover { color: var(--primary); }
        @media (max-width: 640px) { .my-review-head { flex-direction: column; gap: 8px; } }
      `}</style>
      {reviews.map(r => {
        const open = editing === key(r)
        const name = r.target_name ?? "Sin nombre"
        return (
          <div key={key(r)} className="my-review">
            <div className="my-review-head">
              <div>
                {KIND_LABEL[r.kind] && <p style={{ fontSize: 11, color: "var(--muted-strong)", margin: "0 0 2px" }}>{KIND_LABEL[r.kind]}</p>}
                {r.href ? <Link href={r.href} className="my-review-target">{name}</Link> : <span className="my-review-target">{name}</span>}
                <p style={{ fontSize: 11, color: "var(--muted)", margin: "3px 0 0" }}>
                  {timeAgo(r.created_at)}{r.updated_at && " · editada"}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <StarDisplay rating={r.rating} size={14} />
                {!open && (
                  <>
                    <button type="button" className="my-review-action" onClick={() => startEditing(r)}>Editar</button>
                    <button type="button" className="my-review-action" onClick={() => { setDeleteError(null); setDeleteTarget(r) }}>Eliminar</button>
                  </>
                )}
              </div>
            </div>

            {open ? (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <StarPicker value={editRating} onChange={setEditRating} />
                <textarea
                  rows={3}
                  aria-label="Tu reseña"
                  value={editComment}
                  onChange={e => setEditComment(e.target.value)}
                  placeholder="Contá tu experiencia (opcional)..."
                  style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", color: "#1b1b19", background: "#fff", resize: "none", outline: "none", marginTop: 12, boxSizing: "border-box" }}
                />
                {saveError && <p style={{ fontSize: 13, color: "var(--danger)", margin: "10px 0 0" }}>No se pudo guardar el cambio. Probá de nuevo.</p>}
                <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setEditing(null)} style={{ ...button, background: "none", color: "var(--muted)", border: "1px solid var(--border)" }}>Cancelar</button>
                  <button
                    type="button"
                    onClick={() => save(r)}
                    disabled={!editRating || saving}
                    style={{ ...button, fontWeight: 600, background: "var(--primary-dark)", color: "#fff", border: "none", opacity: !editRating || saving ? 0.45 : 1 }}
                  >
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </div>
            ) : (
              r.comment && <p style={{ fontSize: 14, color: "#3d3d3a", lineHeight: 1.65, margin: "10px 0 0", whiteSpace: "pre-line" }}>{r.comment}</p>
            )}
          </div>
        )
      })}

      <ConfirmModal
        open={deleteTarget !== null}
        title="¿Eliminar tu reseña?"
        message="Esta acción no se puede deshacer."
        error={deleteError}
        loading={deleting}
        onConfirm={remove}
        onCancel={() => { setDeleteTarget(null); setDeleteError(null) }}
      />
    </>
  )
}

export default function MyReviewsPage() {
  const [count, setCount] = useState(0)
  return (
    <ProfileSubpage title="Mis reseñas" count={count}>
      {token => <MyReviews token={token} onCount={setCount} />}
    </ProfileSubpage>
  )
}
