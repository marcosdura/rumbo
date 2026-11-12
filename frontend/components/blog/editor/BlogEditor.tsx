"use client"

// El editor de una nota del blog (/admin/blog/[id], o /admin/blog/nueva).
// Cuatro pestañas: los datos de la nota, el mapa, el contenido (bloques) y
// la vista previa, que arma el backend con la misma validación que al
// guardar: si algo falta, se ve arriba antes de publicar.
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { api, ApiError } from "@/lib/api"
import { BLOG_CATEGORIES, type BlogCategory, type BlogPostData } from "@/lib/blog"
import {
  draftSpotIds, effectiveSlug, emptyDraft, fromSaved, sameContent, toPayload,
  type BlogStatus, type Draft, type SavedPost, type SpotLabel,
} from "@/lib/blogEditor"
import BlogArticle from "../BlogArticle"
import BlockEditor from "./BlockEditor"
import ImageField from "./ImageField"
import MapEditor from "./MapEditor"
import "./editor.css"

type Tab = "datos" | "mapa" | "contenido" | "vista"
const PREVIEW_DELAY_MS = 700

const errorText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? (e.status === 403 ? "Solo el admin puede editar el blog." : e.message) : fallback

// Que el inicio del blog y la nota se vean ya, sin esperar el caché.
async function revalidate(slugs: string[]) {
  await fetch("/api/blog/revalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slugs: [...new Set(slugs)] }),
  }).catch(() => {})
}

export default function BlogEditor({ postId: initialId }: { postId: number | null }) {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const token = session?.id_token
  const [postId, setPostId] = useState(initialId)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saved, setSaved] = useState<{ draft: Draft; slug: string | null; status: BlogStatus; published_at: string | null }>(
    () => ({ draft: emptyDraft(), slug: null, status: "draft", published_at: null }),
  )
  const [spots, setSpots] = useState<Record<string, SpotLabel>>({})
  const [loading, setLoading] = useState(initialId !== null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("datos")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [preview, setPreview] = useState<{ data: BlogPostData | null; error: string | null; missing: number[] }>({ data: null, error: null, missing: [] })

  const update = useCallback((fn: (d: Draft) => Draft) => { setDraft(fn); setNotice(null) }, [])
  const addSpot = useCallback((spot: SpotLabel) => setSpots(prev => ({ ...prev, [String(spot.id)]: spot })), [])

  function loadSaved(post: SavedPost) {
    const d = fromSaved(post)
    setDraft(d)
    setSaved({ draft: d, slug: post.slug, status: post.status, published_at: post.published_at })
    setSpots(prev => ({ ...prev, ...post.spots }))
  }

  useEffect(() => {
    if (initialId === null || !token) return
    api.get<SavedPost>(`/admin/blog/posts/${initialId}`, { token })
      .then(({ data }) => loadSaved(data))
      .catch(e => setLoadError(e instanceof ApiError && e.status === 404 ? "Esta nota no existe (¿la borraron?)." : errorText(e, "No se pudo cargar la nota.")))
      .finally(() => setLoading(false))
  }, [initialId, token])

  const dirty = !sameContent(draft, saved.draft)
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  // La vista previa (y la validación): se pide un rato después de dejar de
  // escribir. Si falla, queda la última que anduvo y se muestra el error.
  const payloadJson = useMemo(() => JSON.stringify(toPayload(draft)), [draft])
  const previewPublishedAt = saved.published_at
  const lastPreview = useRef<string | null>(null)
  useEffect(() => {
    if (!token || loading || loadError) return
    const timer = setTimeout(() => {
      const body = { ...JSON.parse(payloadJson), published_at: previewPublishedAt ?? new Date().toISOString() }
      lastPreview.current = payloadJson
      api.post<BlogPostData & { missing_spots: number[] }>("/admin/blog/preview", body, { token })
        .then(({ data }) => {
          if (lastPreview.current !== payloadJson) return
          setPreview({ data, error: null, missing: data.missing_spots ?? [] })
        })
        .catch(e => {
          if (lastPreview.current !== payloadJson) return
          setPreview(prev => ({ ...prev, error: errorText(e, "No se pudo armar la vista previa.") }))
        })
    }, PREVIEW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [payloadJson, previewPublishedAt, token, loading, loadError])

  async function save(status: BlogStatus = draft.status) {
    setSaving(true)
    setSaveError(null)
    setNotice(null)
    try {
      const body = toPayload(draft, status)
      const { data } = postId === null
        ? await api.post<SavedPost>("/admin/blog/posts", body, { token })
        : await api.put<SavedPost>(`/admin/blog/posts/${postId}`, body, { token })
      // Lo editado queda como está (sin rearmar los bloques: no se pierde
      // dónde se estaba escribiendo); del backend, el link, el estado y los
      // datos de los recorridos.
      const next: Draft = { ...draft, slug: data.slug, status: data.status, tracks: data.map?.tracks ?? [] }
      setDraft(next)
      setSaved({ draft: next, slug: data.slug, status: data.status, published_at: data.published_at })
      setSpots(prev => ({ ...prev, ...data.spots }))
      if (postId === null) {
        setPostId(data.id)
        window.history.replaceState(null, "", `/admin/blog/${data.id}`)
      }
      if (data.status === "published" || saved.status === "published") {
        await revalidate([data.slug, ...(saved.slug ? [saved.slug] : [])])
      }
      setNotice(
        status === "published" && saved.status !== "published" ? "¡Publicada! Ya está en el blog."
          : status === "draft" && saved.status === "published" ? "Pasó a borrador: ya no se ve en el blog."
            : "Guardado.",
      )
    } catch (e) {
      setSaveError(errorText(e, "No se pudo guardar. Intentá de nuevo."))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (postId === null) return
    setDeleting(true)
    try {
      await api.del(`/admin/blog/posts/${postId}`, { token })
      if (saved.status === "published" && saved.slug) await revalidate([saved.slug])
      setSaved(prev => ({ ...prev, draft }))
      router.push("/admin?tab=blog")
    } catch (e) {
      setSaveError(errorText(e, "No se pudo borrar."))
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  if (sessionStatus === "loading" || loading) return <p className="be-state">Cargando…</p>
  if (sessionStatus === "unauthenticated") return <p className="be-state">Entrá con tu cuenta de admin.</p>
  if (loadError) return <p className="be-state" role="alert">{loadError} <Link href="/admin?tab=blog">Volver a las notas</Link></p>

  const slug = effectiveSlug(draft)
  const slugChanged = saved.status === "published" && saved.slug !== null && slug !== saved.slug
  const isPublished = saved.status === "published"
  const unavailable = draftSpotIds(draft).filter(id => spots[String(id)]?.available === false || preview.missing.includes(id))
  const tabs: { id: Tab; label: string }[] = [
    { id: "datos", label: "Datos" },
    { id: "mapa", label: `Mapa · ${draft.points.length + draft.tracks.length}` },
    { id: "contenido", label: `Contenido · ${draft.blocks.length}` },
    { id: "vista", label: "👁 Vista previa" },
  ]

  return (
    <div className="be">
      <header className="be-top">
        <div className="be-top-title">
          <Link href="/admin?tab=blog" className="be-back">← Notas</Link>
          <h1>{draft.title.trim() || "Nota nueva"}</h1>
          <span className={`be-status is-${saved.status}`}>{isPublished ? "Publicada" : "Borrador"}</span>
          {dirty && <span className="be-dirty">Cambios sin guardar</span>}
        </div>
        <div className="be-top-actions">
          {isPublished && saved.slug && (
            <a className="be-btn is-quiet" href={`/blog/${saved.slug}`} target="_blank" rel="noreferrer">Ver nota ↗</a>
          )}
          <button type="button" className="be-btn" onClick={() => save()} disabled={saving || (!dirty && postId !== null)}>
            {saving ? "Guardando…" : isPublished ? "Guardar cambios" : "Guardar borrador"}
          </button>
          {isPublished ? (
            <button type="button" className="be-btn is-quiet" onClick={() => save("draft")} disabled={saving}>Pasar a borrador</button>
          ) : (
            <button type="button" className="be-btn is-primary" onClick={() => save("published")} disabled={saving}>Publicar</button>
          )}
        </div>
      </header>

      {(saveError || preview.error || notice) && (
        <div className="be-messages">
          {saveError && <p className="be-msg is-error" role="alert">✕ {saveError}</p>}
          {!saveError && preview.error && <p className="be-msg is-warn">⚠ Falta algo para poder guardar: {preview.error}</p>}
          {notice && <p className="be-msg is-ok" role="status">✓ {notice}</p>}
        </div>
      )}
      {unavailable.length > 0 && (
        <p className="be-msg is-warn">⚠ {unavailable.length === 1 ? "Un lugar de Rumbo de la nota no está publicado" : `${unavailable.length} lugares de Rumbo de la nota no están publicados`}: no se ven en el blog.</p>
      )}

      <nav className="be-tabs" aria-label="Partes de la nota">
        {tabs.map(t => (
          <button key={t.id} type="button" className={`be-tab${tab === t.id ? " is-active" : ""}`} aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "datos" && (
        <div className="be-datos">
          <section className="be-card">
            <label className="be-field">
              <span>Título</span>
              <input className="be-input be-title-input" value={draft.title} maxLength={150} placeholder="Travesía de refugios en Bariloche"
                onChange={e => update(d => ({ ...d, title: e.target.value }))} />
            </label>
            <label className="be-field">
              <span>Resumen <small>{draft.summary.length}/300</small></span>
              <textarea className="be-input be-textarea" rows={3} value={draft.summary} maxLength={300}
                placeholder="Dos o tres líneas: sale en la tarjeta del blog, en Google y al compartir el link."
                onChange={e => update(d => ({ ...d, summary: e.target.value }))} />
            </label>
            <div className="be-grid2">
              <label className="be-field">
                <span>Categoría</span>
                <select className="be-input" value={draft.category} onChange={e => update(d => ({ ...d, category: e.target.value as BlogCategory }))}>
                  {BLOG_CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.emoji} {c.label}</option>)}
                </select>
              </label>
              <label className="be-field">
                <span>Zona</span>
                <input className="be-input" value={draft.region} maxLength={100} placeholder="Bariloche, Argentina"
                  onChange={e => update(d => ({ ...d, region: e.target.value }))} />
              </label>
            </div>
            <label className="be-field">
              <span>Link</span>
              <div className="be-slug">
                <span>rumboapp.uy/blog/</span>
                <input className="be-input" value={draft.slug} placeholder={slug || "se-arma-con-el-titulo"} maxLength={160}
                  onChange={e => update(d => ({ ...d, slug: e.target.value }))} aria-label="Link de la nota" />
              </div>
              {slugChanged
                ? <small className="be-error">Ojo: la nota ya está publicada. Si cambiás el link, los que ya compartiste (Instagram, Google) dejan de andar.</small>
                : <small className="be-hint">Vacío: se arma con el título.</small>}
            </label>
            <label className="be-check">
              <input type="checkbox" checked={draft.featured} onChange={e => update(d => ({ ...d, featured: e.target.checked }))} />
              Destacada: sale grande arriba en el inicio del blog
            </label>
          </section>
          <section className="be-card">
            <h2 className="be-h2">Foto de tapa</h2>
            <p className="be-hint">Sale arriba de la nota, en su tarjeta y al compartir el link. Horizontal, mejor.</p>
            <ImageField value={draft.cover_image} onChange={cover_image => update(d => ({ ...d, cover_image }))} label="Subir tapa" />
          </section>
          {postId !== null && (
            <section className="be-card be-danger-zone">
              <h2 className="be-h2">Borrar la nota</h2>
              <p className="be-hint">{isPublished ? "Deja de estar en el blog y su link da error." : "Se borra el borrador."} No se puede deshacer.</p>
              <button type="button" className="be-btn is-danger" onClick={() => setConfirmDelete(true)}>Borrar nota</button>
            </section>
          )}
        </div>
      )}

      {tab === "mapa" && <MapEditor draft={draft} update={update} spots={spots} addSpot={addSpot} />}
      {tab === "contenido" && <BlockEditor draft={draft} update={update} spots={spots} addSpot={addSpot} />}
      {tab === "vista" && (
        <div className="be-preview">
          {preview.data ? (
            <>
              <p className="be-hint be-preview-note">Así se va a ver{preview.error ? " (la última versión que se pudo armar)" : ""}. Para verla como en el celular, achicá la ventana.</p>
              <BlogArticle post={preview.data} />
            </>
          ) : (
            <p className="be-state">{preview.error ? `Todavía no se puede armar: ${preview.error}` : "Armando la vista previa…"}</p>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmDelete}
        title="¿Borrar esta nota?"
        message={isPublished ? "Deja de estar en el blog y su link da error. No se puede deshacer." : "No se puede deshacer."}
        confirmLabel="Borrar"
        loading={deleting}
        loadingLabel="Borrando…"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </div>
  )
}
