"use client"

import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import Link from "next/link"
import { uploadImageToCloudinary, buildPublicId, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/uploadImage"
import Pill from "@/components/ui/Pill"
import ConfirmModal from "@/components/ui/ConfirmModal"
import SubmittingOverlay from "@/components/ui/SubmittingOverlay"
import { api, ApiError } from "@/lib/api"
import { s, MAX_PHOTOS } from "./styles"
import type { Spot, Review, Tab, StagedPhoto } from "./types"
import { describeFields } from "./changes"
import InfoTab from "./InfoTab"
import PhotosTab from "./PhotosTab"
import ReviewsTab from "./ReviewsTab"
import ChangeRequestBanner from "./ChangeRequestBanner"

// Respuesta de PATCH /admin/spots/{id}: qué se aplicó ya y qué quedó en
// revisión (backend/spot_changes.py decide; con dry_run no escribe nada).
type EditResult = { applied: string[]; pending: string[] }

function errorMessage(e: unknown, fallback: string) {
  // El detail de un 422 de FastAPI es una lista de errores de validación,
  // no un texto para mostrar.
  if (e instanceof ApiError && e.status !== 422 && typeof e.message === "string" && e.message) return e.message
  return fallback
}

export default function SpotDashboardPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const spotId = params.id as string
  const token = session?.id_token

  const [spot, setSpot] = useState<Spot | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push("/"); return }
  }, [session, status])

  useEffect(() => {
    if (!token) return
    Promise.all([
      api.get<Spot[]>("/spots/mine", { token }).then(r => r.data),
      api.get<Review[]>(`/reviews/${spotId}`).then(r => r.data),
    ]).then(([mySpots, reviewsData]) => {
      const found = Array.isArray(mySpots) ? mySpots.find((s: Spot) => String(s.id) === spotId) : null
      if (!found) { router.push("/profile"); return }
      setSpot(found)
      populateFields(found)
      setReviews(Array.isArray(reviewsData) ? reviewsData : [])
      setLoading(false)
    })
  }, [token, spotId])

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
    return {
      name: editName,
      description: editDescription,
      email: editEmail || null,
      whatsapp: editWhatsapp || null,
      instagram: editInstagram || null,
      price: editPrice !== "" ? parseFloat(editPrice) : null,
      season_start: editSeasonType === "seasonal" && editSeasonStart ? parseInt(editSeasonStart) : null,
      season_end: editSeasonType === "seasonal" && editSeasonEnd ? parseInt(editSeasonEnd) : null,
      is_public: editIsPublic,
      public_transport: editPublicTransport,
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
    const valid = files.filter(f => ALLOWED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_IMAGE_BYTES)
    const rejected = files.length - valid.length
    const current = (spot.images?.length ?? 0) + stagedPhotos.length
    // Sin recortar en silencio: si no entran todas, no se agrega ninguna y
    // se dice cuántas hay que borrar.
    if (current + valid.length > MAX_PHOTOS) {
      const extra = current + valid.length - MAX_PHOTOS
      setPhotoError(`El límite es ${MAX_PHOTOS} fotos por lugar. Tenés ${current} y querés agregar ${valid.length}: borrá al menos ${extra} para poder subirlas.`)
      return
    }
    setStagedPhotos(prev => [...prev, ...valid.map(file => ({ file, url: URL.createObjectURL(file) }))])
    setPhotoError(rejected > 0
      ? `${rejected} archivo${rejected !== 1 ? "s" : ""} no se pudo agregar: solo se aceptan imágenes (JPG, PNG, WEBP, GIF, HEIC) de hasta 15MB.`
      : null)
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
                <Pill variant={spot.is_approved ? "green" : "yellow"} size="sm">
                  {spot.is_approved ? "✓ Aprobado" : "⏳ Pendiente de aprobación"}
                </Pill>
                {spot.category && (
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{spot.category.name} · {spot.department}</span>
                )}
              </div>
            </div>
            {spot.slug && (
              <a href={`/spots/${spot.slug}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "1px solid var(--border)", background: "#fff", color: "#3d3d3a", textDecoration: "none" }}>
                Ver spot →
              </a>
            )}
          </div>
        </div>

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
            { id: "reviews", label: `💬 Reseñas (${reviews.length})` },
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
            lockSensitive={pendingRequest !== null}
            pendingName={pendingRequest?.changes.name?.to}
            pendingDescription={pendingRequest?.changes.description?.to}
            sensitiveReviewed={spot.is_approved}
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

        {/* Guardar: uno solo para la información y las fotos nuevas. */}
        {tab !== "reviews" && (
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

        {tab === "reviews" && <ReviewsTab reviews={reviews} />}

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
