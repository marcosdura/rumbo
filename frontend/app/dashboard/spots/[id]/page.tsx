"use client"

import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import Link from "next/link"
import { uploadImageToCloudinary, buildPublicId } from "@/lib/uploadImage"
import Pill from "@/components/ui/Pill"
import ConfirmModal from "@/components/ui/ConfirmModal"
import SubmittingOverlay from "@/components/ui/SubmittingOverlay"
import { api } from "@/lib/api"
import { s, MAX_PHOTOS } from "./styles"
import type { Spot, Review, Tab, StagedPhoto } from "./types"
import { describeFields, checkNewPhotos, errorMessage, isStaySpot, contentTabLabel, priceMode } from "./changes"
import InfoTab from "./InfoTab"
import PhotosTab from "./PhotosTab"
import ReviewsTab from "./ReviewsTab"
import ContentTab from "./ContentTab"
import ChangeRequestBanner from "./ChangeRequestBanner"
import RejectionBanner from "./RejectionBanner"
import type { PracticalKey } from "@/lib/practicalInfo"

const REVIEWS_PAGE = 50

type PayloadFields = {
  name: string; description: string; email: string; whatsapp: string; instagram: string; price: string
  seasonType: "all_year" | "seasonal"; seasonStart: string; seasonEnd: string
  isPublic: boolean | null; publicTransport: string | null; practical: Record<PracticalKey, boolean | null>
}

// Lo que se manda a PATCH /admin/spots/{id}. También sirve para saber si hay
// cambios sin guardar (comparando con lo que se cargó).
function payloadFrom(f: PayloadFields) {
  return {
    name: f.name,
    description: f.description,
    email: f.email || null,
    whatsapp: f.whatsapp || null,
    instagram: f.instagram || null,
    price: f.price !== "" ? parseFloat(f.price) : null,
    season_start: f.seasonType === "seasonal" && f.seasonStart ? parseInt(f.seasonStart) : null,
    season_end: f.seasonType === "seasonal" && f.seasonEnd ? parseInt(f.seasonEnd) : null,
    is_public: f.isPublic,
    public_transport: f.publicTransport,
    ...f.practical,
  }
}

// Respuesta de PATCH /admin/spots/{id}: qué se aplicó ya y qué quedó en
// revisión (backend/spot_changes.py decide; con dry_run no escribe nada).
type EditResult = { applied: string[]; pending: string[] }

export default function SpotDashboardPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const spotId = params.id as string
  const token = session?.id_token

  const [spot, setSpot] = useState<Spot | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsTotal, setReviewsTotal] = useState(0)
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [tab, setTab] = useState<Tab>("info")
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Fotos elegidas que todavía no se subieron: se suben a Cloudinary recién
  // al guardar, así si el dueño se arrepiente no quedan archivos sueltos.
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  // Aviso previo cuando algo del guardado va a revisión.
  const [reviewPreview, setReviewPreview] = useState<EditResult | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [dismissing, setDismissing] = useState(false)
  const [resubmitting, setResubmitting] = useState(false)
  const [resubmitError, setResubmitError] = useState<string | null>(null)

  // Campos editables
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editWhatsapp, setEditWhatsapp] = useState("")
  const [editInstagram, setEditInstagram] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [editSeasonType, setEditSeasonType] = useState<"all_year" | "seasonal">("all_year")
  const [editSeasonStart, setEditSeasonStart] = useState("")
  const [editSeasonEnd, setEditSeasonEnd] = useState("")
  const [editIsPublic, setEditIsPublic] = useState<boolean | null>(null)
  const [editPublicTransport, setEditPublicTransport] = useState<string | null>(null)
  const [editPractical, setEditPractical] = useState<Record<PracticalKey, boolean | null>>({
    pets_allowed: null, reservation_required: null, cell_signal: null,
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push("/"); return }
  }, [session, status])

  useEffect(() => {
    if (!token) return
    Promise.all([
      api.get<Spot[]>("/spots/mine", { token }),
      api.get<Review[]>(`/reviews/${spotId}`, { params: { limit: REVIEWS_PAGE } }),
    ]).then(([mine, reviewsRes]) => {
      const found = Array.isArray(mine.data) ? mine.data.find((s: Spot) => String(s.id) === spotId) : null
      if (!found) { router.push("/profile"); return }
      setSpot(found)
      populateFields(found)
      const list = Array.isArray(reviewsRes.data) ? reviewsRes.data : []
      setReviews(list)
      setReviewsTotal(reviewsRes.totalCount ?? list.length)
      setLoadError(false)
      setLoading(false)
    })
      // Antes no había catch: si fallaba, quedaba en "Cargando..." para siempre.
      .catch(() => { setLoadError(true); setLoading(false) })
  }, [token, spotId, loadAttempt])

  async function loadMoreReviews() {
    setLoadingMoreReviews(true)
    try {
      const { data, totalCount } = await api.get<Review[]>(`/reviews/${spotId}`, { params: { limit: REVIEWS_PAGE, offset: reviews.length } })
      setReviews(prev => [...prev, ...(Array.isArray(data) ? data : [])])
      if (totalCount != null) setReviewsTotal(totalCount)
    } catch {
      // Queda el botón para volver a intentar.
    }
    setLoadingMoreReviews(false)
  }

  // Cambios sin guardar: el navegador avisa antes de salir de la página.
  const baseline = useRef<string | null>(null)
  const dirty = spot !== null && (stagedPhotos.length > 0 || (baseline.current !== null && JSON.stringify(buildPayload()) !== baseline.current))
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "" }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  // Liberar las previews (URL.createObjectURL) al salir de la página.
  const stagedRef = useRef(stagedPhotos)
  stagedRef.current = stagedPhotos
  useEffect(() => () => stagedRef.current.forEach(p => URL.revokeObjectURL(p.url)), [])

  function populateFields(s: Spot) {
    setEditName(s.name ?? "")
    setEditDescription(s.description ?? "")
    setEditEmail(s.email ?? "")
    setEditWhatsapp(s.whatsapp ?? "")
    setEditInstagram(s.instagram ?? "")
    setEditPrice(s.price != null ? String(s.price) : "")
    setEditSeasonType(s.season_start ? "seasonal" : "all_year")
    setEditSeasonStart(s.season_start ? String(s.season_start) : "")
    setEditSeasonEnd(s.season_end ? String(s.season_end) : "")
    setEditIsPublic(s.is_public ?? null)
    setEditPublicTransport(s.public_transport ?? null)
    const practical = {
      pets_allowed: s.pets_allowed ?? null,
      reservation_required: s.reservation_required ?? null,
      cell_signal: s.cell_signal ?? null,
    }
    setEditPractical(practical)
    baseline.current = JSON.stringify(payloadFrom({
      name: s.name ?? "", description: s.description ?? "", email: s.email ?? "", whatsapp: s.whatsapp ?? "",
      instagram: s.instagram ?? "", price: s.price != null ? String(s.price) : "",
      seasonType: s.season_start ? "seasonal" : "all_year",
      seasonStart: s.season_start ? String(s.season_start) : "", seasonEnd: s.season_end ? String(s.season_end) : "",
      isPublic: s.is_public ?? null, publicTransport: s.public_transport ?? null, practical,
    }))
  }

  async function refreshSpot() {
    const { data } = await api.get<Spot[]>("/spots/mine", { token })
    const found = Array.isArray(data) ? data.find((s: Spot) => String(s.id) === spotId) : null
    if (found) {
      setSpot(found)
      populateFields(found)
    }
  }

  function buildPayload() {
    return payloadFrom({
      name: editName, description: editDescription, email: editEmail, whatsapp: editWhatsapp, instagram: editInstagram,
      price: editPrice, seasonType: editSeasonType, seasonStart: editSeasonStart, seasonEnd: editSeasonEnd,
      isPublic: editIsPublic, publicTransport: editPublicTransport, practical: editPractical,
    })
  }

  function showSaveOk(message: string) {
    setSaveOk(message)
    setTimeout(() => setSaveOk(null), 4000)
  }

  // Paso 1: preguntarle al backend qué pasaría (dry_run), sin subir nada.
  // Si algo va a revisión, se muestra el aviso antes de seguir.
  async function handleSave() {
    if (!spot) return
    setSaving(true)
    setSaveOk(null)
    setSaveError(null)
    try {
      // Ids de mentira con el formato real: al dry_run solo le importa
      // cuántas fotos son, todavía no se subió ninguna.
      const { data } = await api.patch<EditResult>(`/admin/spots/${spot.id}`, {
        ...buildPayload(),
        photos_added: stagedPhotos.map(() => buildPublicId(spot.id)),
      }, { token, params: { dry_run: true } })
      if (data.pending.length === 0 && data.applied.length === 0) {
        showSaveOk("No había cambios para guardar.")
      } else if (data.pending.length > 0) {
        setReviewPreview(data)
      } else {
        await commitSave()
      }
    } catch (e) {
      setSaveError(errorMessage(e, "No se pudo guardar. Intentá de nuevo."))
    } finally {
      setSaving(false)
    }
  }

  // Paso 2: subir las fotos nuevas y guardar de verdad.
  async function commitSave() {
    if (!spot) return
    setReviewPreview(null)
    setSaveError(null)
    setSubmitting(true)
    const uploaded: string[] = []
    try {
      for (let i = 0; i < stagedPhotos.length; i++) {
        setUploadProgress(`Subiendo foto ${i + 1} de ${stagedPhotos.length}...`)
        const { publicId } = await uploadImageToCloudinary(stagedPhotos[i].file, { spotId: spot.id })
        uploaded.push(publicId)
      }
      setUploadProgress("Guardando cambios...")
      const { data } = await api.patch<EditResult>(`/admin/spots/${spot.id}`, {
        ...buildPayload(),
        photos_added: uploaded,
      }, { token })
      stagedPhotos.forEach(p => URL.revokeObjectURL(p.url))
      setStagedPhotos([])
      await refreshSpot()
      showSaveOk(data.pending.length > 0
        ? `✓ Guardado. En revisión: ${describeFields(data.pending, uploaded.length)}.`
        : "✓ Guardado correctamente")
    } catch (e) {
      // Si el guardado falló después de subir fotos, se borran de Cloudinary:
      // no quedaron asociadas a nada.
      if (uploaded.length) {
        api.post(`/spots/${spot.id}/change-request/discard-photos`, { public_ids: uploaded }, { token }).catch(() => {})
      }
      setSaveError(errorMessage(e, "No se pudo guardar. Intentá de nuevo."))
    } finally {
      setSubmitting(false)
      setUploadProgress(null)
    }
  }

  async function handleCancelRequest() {
    if (!spot) return
    setCancelLoading(true)
    setCancelError(null)
    try {
      await api.post(`/spots/${spot.id}/change-request/cancel`, undefined, { token })
      await refreshSpot()
      setCancelOpen(false)
    } catch (e) {
      setCancelError(errorMessage(e, "No se pudo cancelar el cambio. Intentá de nuevo."))
    } finally {
      setCancelLoading(false)
    }
  }

  async function handleResubmit() {
    if (!spot) return
    setResubmitting(true)
    setResubmitError(null)
    try {
      await api.post(`/spots/${spot.id}/resubmit`, undefined, { token })
      await refreshSpot()
    } catch (e) {
      setResubmitError(errorMessage(e, "No se pudo enviar. Intentá de nuevo."))
    } finally {
      setResubmitting(false)
    }
  }

  async function handleDismissRequest() {
    if (!spot) return
    setDismissing(true)
    try {
      await api.post(`/spots/${spot.id}/change-request/dismiss`, undefined, { token })
      setSpot(prev => prev ? { ...prev, change_request: null } : null)
    } catch {
      // Cerrar el aviso no es crítico: si falla, el aviso sigue ahí y se
      // puede volver a intentar.
    } finally {
      setDismissing(false)
    }
  }

  function handleAddFiles(files: File[]) {
    if (!spot) return
    const { accepted, error } = checkNewPhotos(files, (spot.images?.length ?? 0) + stagedPhotos.length)
    if (accepted.length) {
      setStagedPhotos(prev => [...prev, ...accepted.map(file => ({ file, url: URL.createObjectURL(file) }))])
    }
    setPhotoError(error)
  }

  function handleRemoveStaged(index: number) {
    setStagedPhotos(prev => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
    setPhotoError(null)
  }

  async function handleSetMain(publicId: string) {
    if (!spot) return
    setPhotoLoading(true)
    setPhotoError(null)
    try {
      await api.patch(`/admin/spots/${spot.id}/main-image`, { cloudinary_public_id: publicId }, { token })
      setSpot(prev => prev ? {
        ...prev,
        images: prev.images.map(img => ({ ...img, is_main: img.cloudinary_public_id === publicId })),
      } : null)
    } catch {
      setPhotoError("No se pudo cambiar la foto principal. Intentá de nuevo.")
    } finally {
      setPhotoLoading(false)
    }
  }

  async function handleDeletePhoto(publicId: string) {
    if (!spot) return
    setPhotoLoading(true)
    setDeleteError(null)
    try {
      await api.del(`/admin/images/${encodeURIComponent(publicId)}`, { token })
      setSpot(prev => prev ? { ...prev, images: prev.images.filter(img => img.cloudinary_public_id !== publicId) } : null)
      setPhotoToDelete(null)
    } catch {
      setDeleteError("No se pudo eliminar la foto. Intentá de nuevo.")
    } finally {
      setPhotoLoading(false)
    }
  }

  if (loadError) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
        <Navbar />
        <div role="alert" style={{ maxWidth: 720, margin: "40px auto", padding: "0 24px" }}>
          <p style={{ color: "var(--danger)", fontSize: 14, margin: "0 0 12px" }}>No se pudo cargar tu lugar.</p>
          <button type="button" onClick={() => { setLoadError(false); setLoading(true); setLoadAttempt(n => n + 1) }}
            style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontFamily: "inherit", border: "1px solid var(--border)", background: "#fff", cursor: "pointer" }}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
        <Navbar />
        <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 24px" }}>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!spot) return null

  const sortedImages = [...(spot.images ?? [])].sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
  const photoCount = (spot.images?.length ?? 0) + stagedPhotos.length
  const atPhotoLimit = photoCount >= MAX_PHOTOS
  const changeRequest = spot.change_request
  const pendingRequest = changeRequest?.status === "pending" ? changeRequest : null
  const pendingPhotoCount = pendingRequest?.changes.photos_added?.length ?? 0
  const showGlamping = spot.category?.name === "Glamping" || (spot.activities ?? []).includes("Glamping")
  // Experiencias solo en alojamientos: es lo que ofrece agregar-lugar y lo
  // único que muestra la página pública (ExperienciasSection).
  const showExperiences = isStaySpot(spot.category?.name)
  const contentLabel = contentTabLabel(spot.category?.name, showGlamping)

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/profile" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
            ← Volver al perfil
          </Link>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 26, fontWeight: 600, color: "#1b1b19", margin: "0 0 6px" }}>
                {spot.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Pill variant={spot.is_approved ? "green" : spot.rejected_at ? "red" : "yellow"} size="sm">
                  {spot.is_approved ? "✓ Aprobado" : spot.rejected_at ? "✕ Rechazado" : "⏳ Pendiente de aprobación"}
                </Pill>
                {spot.category && (
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{spot.category.name} · {spot.department}</span>
                )}
              </div>
            </div>
            {/* Sin aprobar, la página pública no existe todavía (daba 404). */}
            {spot.slug && spot.is_approved && (
              <a href={`/spots/${spot.slug}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "1px solid var(--border)", background: "#fff", color: "#3d3d3a", textDecoration: "none" }}>
                Ver lugar →
              </a>
            )}
          </div>
        </div>

        {!spot.is_approved && spot.rejected_at && spot.rejection_reason && (
          <RejectionBanner
            reason={spot.rejection_reason}
            onResubmit={handleResubmit}
            resubmitting={resubmitting}
            error={resubmitError}
          />
        )}

        {changeRequest && (
          <ChangeRequestBanner
            request={changeRequest}
            onCancel={() => { setCancelError(null); setCancelOpen(true) }}
            onDismiss={handleDismissRequest}
            dismissing={dismissing}
          />
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Reseñas", value: spot.review_count ?? 0, emoji: "💬" },
            { label: "Calificación", value: spot.average_rating ? `${spot.average_rating} ★` : "—", emoji: "⭐" },
          ].map(stat => (
            <div key={stat.label} style={{ ...s.card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f7f5f0", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                {stat.emoji}
              </div>
              <div>
                <p style={{ fontSize: 22, fontFamily: "var(--font-playfair-display), serif", fontWeight: 600, color: "#1b1b19", margin: "0 0 2px", lineHeight: 1 }}>{stat.value}</p>
                <p style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {([
            { id: "info", label: "✏️ Información" },
            { id: "fotos", label: `📷 Fotos (${photoCount}/${MAX_PHOTOS})` },
            ...(contentLabel ? [{ id: "contenido", label: contentLabel }] : []),
            { id: "reviews", label: `💬 Reseñas (${reviewsTotal})` },
          ] as { id: Tab; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={s.tab(tab === t.id)}>{t.label}</button>
          ))}
        </div>

        {tab === "info" && (
          <InfoTab
            editName={editName} setEditName={setEditName}
            editDescription={editDescription} setEditDescription={setEditDescription}
            editEmail={editEmail} setEditEmail={setEditEmail}
            editWhatsapp={editWhatsapp} setEditWhatsapp={setEditWhatsapp}
            editInstagram={editInstagram} setEditInstagram={setEditInstagram}
            editPrice={editPrice} setEditPrice={setEditPrice}
            editSeasonType={editSeasonType} setEditSeasonType={setEditSeasonType}
            editSeasonStart={editSeasonStart} setEditSeasonStart={setEditSeasonStart}
            editSeasonEnd={editSeasonEnd} setEditSeasonEnd={setEditSeasonEnd}
            editIsPublic={editIsPublic} setEditIsPublic={setEditIsPublic}
            editPublicTransport={editPublicTransport} setEditPublicTransport={setEditPublicTransport}
            editPractical={editPractical} setEditPractical={(key, v) => setEditPractical(p => ({ ...p, [key]: v }))}
            lockSensitive={pendingRequest !== null}
            pendingName={pendingRequest?.changes.name?.to}
            pendingDescription={pendingRequest?.changes.description?.to}
            sensitiveReviewed={spot.is_approved}
            priceMode={priceMode(spot.activities ?? (spot.category ? [spot.category.name] : []))}
          />
        )}

        {tab === "fotos" && (
          <PhotosTab
            sortedImages={sortedImages}
            stagedPhotos={stagedPhotos}
            pendingPhotoIds={pendingRequest?.changes.photos_added ?? []}
            photoCount={photoCount}
            atPhotoLimit={atPhotoLimit}
            lockAdd={pendingRequest !== null}
            sensitiveReviewed={spot.is_approved}
            photoError={photoError}
            photoLoading={photoLoading}
            setPhotoError={setPhotoError}
            onAddFiles={handleAddFiles}
            onRemoveStaged={handleRemoveStaged}
            onSetMain={handleSetMain}
            onDeletePhoto={id => { setDeleteError(null); setPhotoToDelete(id) }}
          />
        )}

        {/* Se monta siempre y se oculta: así lo que estás escribiendo no se
            pierde al cambiar de pestaña (mismo motivo por el que los campos
            de Información viven en esta página). */}
        {contentLabel && (
          <div style={{ display: tab === "contenido" ? "block" : "none" }}>
            <ContentTab
              spotId={spot.id}
              token={token}
              reviewed={spot.is_approved}
              category={spot.category?.name ?? null}
              showExperiences={showExperiences}
              showGlamping={showGlamping}
            />
          </div>
        )}

        {/* Guardar: uno solo para la información y las fotos nuevas. */}
        {(tab === "info" || tab === "fotos") && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <button
              onClick={handleSave}
              disabled={saving || submitting}
              style={{ padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "var(--primary)", color: "#fff", border: "none", opacity: saving || submitting ? 0.7 : 1 }}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            {stagedPhotos.length > 0 && !saveError && (
              <span style={{ fontSize: 13, color: "var(--muted-strong)" }}>
                {stagedPhotos.length} foto{stagedPhotos.length !== 1 ? "s" : ""} sin guardar
              </span>
            )}
            {saveOk && <span style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600 }}>{saveOk}</span>}
            {saveError && <span style={{ fontSize: 13, color: "var(--danger)" }}>{saveError}</span>}
          </div>
        )}

        {tab === "reviews" && <ReviewsTab reviews={reviews} total={reviewsTotal} onMore={loadMoreReviews} loadingMore={loadingMoreReviews} />}

      </div>

      <ConfirmModal
        open={reviewPreview !== null}
        title="Algunos cambios pasan a revisión"
        confirmLabel="Guardar cambios"
        cancelLabel="Volver"
        confirmVariant="primary"
        onCancel={() => setReviewPreview(null)}
        onConfirm={commitSave}
      >
        {reviewPreview && (
          <div style={{ fontSize: 14, color: "#4a4a46", lineHeight: 1.6 }}>
            <p style={{ margin: 0 }}>
              ⏳ <strong>Pasan a revisión:</strong> {describeFields(reviewPreview.pending, stagedPhotos.length)}.
              El público sigue viendo la versión actual hasta que se aprueben.
            </p>
            {reviewPreview.applied.length > 0 && (
              <p style={{ margin: "10px 0 0" }}>
                ✓ <strong>Se actualizan al instante:</strong> {describeFields(reviewPreview.applied, 0)}.
              </p>
            )}
          </div>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={cancelOpen}
        title="¿Cancelar el cambio en revisión?"
        message={pendingPhotoCount === 0
          ? "Se descarta el pedido. No se puede deshacer."
          : pendingPhotoCount === 1
            ? "Se descarta el pedido y se borra la foto nueva que subiste. No se puede deshacer."
            : `Se descarta el pedido y se borran las ${pendingPhotoCount} fotos nuevas que subiste. No se puede deshacer.`}
        confirmLabel="Cancelar cambio"
        cancelLabel="Volver"
        loading={cancelLoading}
        loadingLabel="Cancelando..."
        error={cancelError}
        onCancel={() => setCancelOpen(false)}
        onConfirm={handleCancelRequest}
      />

      <ConfirmModal
        open={photoToDelete !== null}
        title="¿Eliminar esta foto?"
        message="La foto se borra de Cloudinary y no se puede recuperar."
        loading={photoLoading}
        error={deleteError}
        onCancel={() => setPhotoToDelete(null)}
        onConfirm={() => photoToDelete && handleDeletePhoto(photoToDelete)}
      />

      {submitting && <SubmittingOverlay title="Guardando tus cambios..." uploadProgress={uploadProgress} />}
    </div>
  )
}
