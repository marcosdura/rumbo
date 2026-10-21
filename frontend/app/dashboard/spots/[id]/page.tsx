"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import LoginRequired from "@/components/layout/LoginRequired"
import { uploadImageToCloudinary, buildPublicId } from "@/lib/uploadImage"
import ConfirmModal from "@/components/ui/ConfirmModal"
import SubmittingOverlay from "@/components/ui/SubmittingOverlay"
import { api } from "@/lib/api"
import { s, MAX_PHOTOS } from "./styles"
import type { Spot, Review, Tab } from "./types"
import { describeFields, errorMessage, isStaySpot, contentTabLabel, priceMode } from "./changes"
import InfoTab from "./InfoTab"
import PhotosTab from "./PhotosTab"
import ReviewsTab from "./ReviewsTab"
import ContentTab from "./ContentTab"
import ChangeRequestBanner from "./ChangeRequestBanner"
import RejectionBanner from "./RejectionBanner"
import { DashboardHeader, OwnerStats } from "./DashboardHeader"
import { useSpotForm } from "./useSpotForm"
import { useStagedPhotos } from "./useStagedPhotos"

const REVIEWS_PAGE = 50

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
  // Visitas (últimos 30 días) y favoritos: un extra, sin esto el panel anda igual.
  const [stats, setStats] = useState<{ views_30d: number; favorites: number } | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [tab, setTab] = useState<Tab>("info")
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const form = useSpotForm()
  const photos = useStagedPhotos(spot, setSpot, token)
  const stagedPhotos = photos.stagedPhotos
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


  useEffect(() => {
    if (!token) return
    Promise.all([
      api.get<Spot[]>("/spots/mine", { token }),
      api.get<Review[]>(`/reviews/${spotId}`, { params: { limit: REVIEWS_PAGE } }),
    ]).then(([mine, reviewsRes]) => {
      const found = Array.isArray(mine.data) ? mine.data.find((s: Spot) => String(s.id) === spotId) : null
      if (!found) { router.push("/profile"); return }
      setSpot(found)
      form.populate(found)
      const list = Array.isArray(reviewsRes.data) ? reviewsRes.data : []
      setReviews(list)
      setReviewsTotal(reviewsRes.totalCount ?? list.length)
      setLoadError(false)
      setLoading(false)
    })
      // Antes no había catch: si fallaba, quedaba en "Cargando..." para siempre.
      .catch(() => { setLoadError(true); setLoading(false) })
    // router es estable; form.populate solo copia lo que llega a los campos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, spotId, loadAttempt])

  useEffect(() => {
    if (!token) return
    api.get<{ views_30d: number; favorites: number }>(`/spots/${spotId}/owner-stats`, { token })
      .then(({ data }) => setStats(data))
      .catch(() => {})
  }, [token, spotId])

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
  const dirty = spot !== null && (stagedPhotos.length > 0 || form.changed)
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "" }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  async function refreshSpot() {
    const { data } = await api.get<Spot[]>("/spots/mine", { token })
    const found = Array.isArray(data) ? data.find((s: Spot) => String(s.id) === spotId) : null
    if (found) {
      setSpot(found)
      form.populate(found)
    }
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
        ...form.buildPayload(),
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
        ...form.buildPayload(),
        photos_added: uploaded,
      }, { token })
      photos.clearStaged()
      form.setNewLocation(null)
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

  // Sin sesión: pedirla y volver acá (antes mandaba a la home).
  if (status === "unauthenticated") return <LoginRequired page="Panel de tu lugar" />

  if (loadError) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
        <Navbar />
        <main id="contenido" role="alert" style={{ maxWidth: 720, margin: "40px auto", padding: "0 24px" }}>
          <p style={{ color: "var(--danger)", fontSize: 14, margin: "0 0 12px" }}>No se pudo cargar tu lugar.</p>
          <button type="button" onClick={() => { setLoadError(false); setLoading(true); setLoadAttempt(n => n + 1) }}
            style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontFamily: "inherit", border: "1px solid var(--border)", background: "#fff", cursor: "pointer" }}>
            Reintentar
          </button>
        </main>
      </div>
    )
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
        <Navbar />
        <main id="contenido" style={{ maxWidth: 720, margin: "40px auto", padding: "0 24px" }}>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</p>
        </main>
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

      <main id="contenido" className="form-hover" style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 60px" }}>

        <DashboardHeader spot={spot} />

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

        <OwnerStats spot={spot} stats={stats} />

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
            {...form.infoProps}
            lockSensitive={pendingRequest !== null}
            pendingName={pendingRequest?.changes.name?.to}
            pendingDescription={pendingRequest?.changes.description?.to}
            sensitiveReviewed={spot.is_approved}
            priceMode={priceMode(spot.activities ?? (spot.category ? [spot.category.name] : []))}
            location={[spot.lat ?? null, spot.lng ?? null]}
            pendingLocation={pendingRequest?.changes.location?.to}
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
            photoError={photos.photoError}
            photoLoading={photos.photoLoading}
            setPhotoError={photos.setPhotoError}
            onAddFiles={photos.add}
            onRemoveStaged={photos.removeStaged}
            onSetMain={photos.setMain}
            onDeletePhoto={photos.requestDelete}
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
              activities={spot.activities ?? (spot.category ? [spot.category.name] : [])}
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

      </main>

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
        open={photos.photoToDelete !== null}
        title="¿Eliminar esta foto?"
        message="La foto se borra de Cloudinary y no se puede recuperar."
        loading={photos.photoLoading}
        error={photos.deleteError}
        onCancel={() => photos.setPhotoToDelete(null)}
        onConfirm={() => photos.photoToDelete && photos.deletePhoto(photos.photoToDelete)}
      />

      {submitting && <SubmittingOverlay title="Guardando tus cambios..." uploadProgress={uploadProgress} />}
    </div>
  )
}
