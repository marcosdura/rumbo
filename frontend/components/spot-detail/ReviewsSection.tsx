"use client"

// Las reseñas de un lugar: el promedio, escribir o editar la propia (con una
// foto opcional que pasa por revisión), la lista paginada y borrar la propia.
// La tarjeta y el formulario están en ReviewCard y ReviewForm.
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { StarDisplay } from "@/components/ui/StarRating"
import ConfirmModal from "@/components/ui/ConfirmModal"
import AuthModal from "@/components/layout/AuthModal"
import ImageGallery from "@/components/spot-detail/ImageGallery"
import { trackEvent } from "@/lib/analytics"
import { api } from "@/lib/api"
import { uploadImageToCloudinary } from "@/lib/uploadImage"
import ReviewCard, { type Review, type ReviewPhoto } from "./ReviewCard"
import ReviewForm from "./ReviewForm"

type MyReview = { id: number; rating: number; comment: string | null; photo?: ReviewPhoto | null }
type Summary = { average: number | null; total: number; my_review: MyReview | null }

const REVIEWS_PAGE_SIZE = 10

export default function ReviewsSection({ spotId }: { spotId: number }) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsTotal, setReviewsTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  // null = el form está creando. Con id = está editando esa reseña.
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  // Un error por operación: cargar la lista no es lo mismo que paginarla,
  // publicar o borrar — cada uno se muestra donde el usuario está mirando.
  const [loadError, setLoadError] = useState(false)
  const [moreError, setMoreError] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // La foto de la reseña (una, opcional): se sube después de guardarla y
  // pasa por revisión (backend/item_photos.py).
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  // Qué pasó con la foto, para avisar arriba de la lista.
  const [photoNotice, setPhotoNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [galleryPhoto, setGalleryPhoto] = useState<ReviewPhoto | null>(null)
  const [removingPhoto, setRemovingPhoto] = useState(false)

  const token = session?.id_token

  const basePath = `/reviews/${spotId}`

  // El error se limpia recién al cargar bien: mientras reintenta, "Cargando..."
  // tiene prioridad sobre el aviso de error.
  // Con .then y no async/await: el lint de React solo reconoce como
  // asíncrono el setState que va dentro de un callback.
  const loadReviews = () =>
    Promise.all([
      api.get<Review[]>(basePath, { token, params: { limit: REVIEWS_PAGE_SIZE, offset: 0 } }),
      // Con token el summary devuelve además my_review: es la única forma de
      // saber si el usuario ya reseñó, porque su reseña puede estar en una
      // página que todavía no se cargó.
      api.get<Summary>(`${basePath}/summary`, { token }),
    ])
      .then(([revResult, sumResult]) => {
        setReviews(Array.isArray(revResult.data) ? revResult.data : [])
        setReviewsTotal(revResult.totalCount ?? 0)
        setSummary(sumResult.data)
        setLoadError(false)
      })
      .catch(() => {
        // Sin esto la lista queda vacía y la UI dice "todavía no hay reseñas",
        // que es mentira: no se pudieron cargar.
        setLoadError(true)
      })
      .finally(() => setLoading(false))

  const loadMoreReviews = async () => {
    if (loadingMore) return
    setLoadingMore(true)
    setMoreError(false)
    try {
      const { data, totalCount } = await api.get<Review[]>(basePath, { token, params: { limit: REVIEWS_PAGE_SIZE, offset: reviews.length } })
      if (totalCount != null) setReviewsTotal(totalCount)
      setReviews(prev => [...prev, ...(Array.isArray(data) ? data : [])])
    } catch {
      setMoreError(true)
    }
    setLoadingMore(false)
  }

  // También cuando llega la sesión (llega un momento después de abrir la
  // página): con ella se sabe cuál es tu reseña. Antes solo dependía del
  // lugar y la primera carga, sin sesión, quedaba para siempre.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- loadReviews se arma en cada render con spotId y token
  useEffect(() => { loadReviews() }, [spotId, token])

  // Abre el form en modo edición, precargado con lo que la reseña ya tiene.
  const startEditing = (review: { id: number; rating: number; comment?: string | null }) => {
    setEditingId(review.id)
    setRating(review.rating)
    setComment(review.comment ?? "")
    setSubmitError(false)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setRating(0)
    setComment("")
    setPhotoFiles([])
    setSubmitError(false)
  }

  // La foto que ya tiene la reseña que se está editando (publicada o en revisión).
  const editingPhoto = editingId && summary?.my_review?.id === editingId ? summary.my_review.photo ?? null : null

  const uploadPhoto = async (reviewId: number) => {
    const { publicId } = await uploadImageToCloudinary(photoFiles[0], { spotId })
    await api.post("/photos", { target: "review", target_id: reviewId, public_ids: [publicId] }, { token })
  }

  const removePhoto = async () => {
    if (!editingPhoto) return
    setRemovingPhoto(true)
    try {
      await api.del(`/photos/${editingPhoto.id}`, { token })
      setPhotoNotice({ ok: true, text: "Sacaste la foto de tu reseña." })
      closeForm()
      loadReviews()
    } catch {
      setPhotoNotice({ ok: false, text: "No se pudo sacar la foto. Intentá de nuevo." })
    }
    setRemovingPhoto(false)
  }

  const handleSubmit = async () => {
    if (!rating) return
    setSubmitting(true)
    setSubmitError(false)
    try {
      let reviewId = editingId
      if (editingId) {
        await api.patch(`/reviews/${editingId}`, { rating, comment }, { token })
      } else {
        const { data } = await api.post<{ id: number }>(basePath, { rating, comment }, { token })
        reviewId = data.id
        trackEvent("post_review", { entity_type: "spot", rating, spot_id: spotId })
      }
      // La reseña ya quedó: si la foto falla, se avisa sin perderla.
      if (photoFiles.length > 0 && reviewId) {
        try {
          await uploadPhoto(reviewId)
          setPhotoNotice({ ok: true, text: "⏳ ¡Gracias! Tu foto queda en revisión y se publica cuando el equipo de Rumbo la apruebe." })
        } catch (e) {
          setPhotoNotice({ ok: false, text: `Tu reseña quedó guardada, pero la foto no se pudo subir${e instanceof Error && e.message ? `: ${e.message}` : "."}` })
        }
      } else {
        setPhotoNotice(null)
      }
      closeForm()
      loadReviews()
    } catch {
      // El form queda abierto con lo escrito, así reintentar es apretar
      // el botón de nuevo.
      setSubmitError(true)
    }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    if (!deleteTargetId) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await api.del(`/reviews/${deleteTargetId}`, { token })
      loadReviews()
      setDeleteTargetId(null)
    } catch {
      // El modal se queda abierto mostrando el error, para poder reintentar.
      setDeleteError("No se pudo eliminar la reseña. Intentá de nuevo.")
    }
    setDeleting(false)
  }

  return (
    <>
      <style>{`
        .reviews-wrap {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px 28px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          font-family: var(--font-dm-sans), sans-serif;
        }

        /* Header: título+rating a la izq, botón a la der */
        .reviews-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 24px;
        }

        .reviews-write-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: #fff;
          font-size: 14px;
          font-family: var(--font-dm-sans), sans-serif;
          font-weight: 500;
          cursor: pointer;
          color: var(--primary-dark);
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          white-space: nowrap;
          flex-shrink: 0;
        }
        @media (hover: hover) {
          .reviews-write-btn:hover {
            background: #f0f7f3;
            transform: translateY(-1px);
          }
        }

        /* Review card */
        .review-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px 20px;
        }
        .review-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .review-card-user {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .review-card-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .reviews-delete-btn,
        .reviews-edit-btn {
          font-size: 11px;
          color: var(--muted);
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-dm-sans), sans-serif;
          transition: color 0.15s;
          padding: 0;
        }
        @media (hover: hover) {
          .reviews-delete-btn:hover { color: var(--danger); }
          .reviews-edit-btn:hover { color: var(--primary); }
        }

        /* Form actions */
        .reviews-form-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          justify-content: flex-end;
        }

        /* Mobile */
        @media (max-width: 640px) {
          .reviews-wrap { padding: 20px 16px; }

          .reviews-header { flex-direction: column; align-items: stretch; }
          .reviews-write-btn { justify-content: center; }

          .reviews-form-actions { flex-direction: column-reverse; }
          .reviews-form-actions button { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="reviews-wrap">

        {/* Header */}
        <div className="reviews-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
                Opiniones
              </span>
            </div>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 22, fontWeight: 700, color: "#1b1b19", margin: 0 }}>
              Reseñas
            </p>
            {summary && summary.total > 0 && summary.average != null && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 36, fontWeight: 700, color: "#1b1b19", lineHeight: 1 }}>
                  {summary.average}
                </span>
                <div>
                  <StarDisplay rating={Math.round(summary.average)} />
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {summary.total} reseña{summary.total !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}
          </div>

          {!showForm && (
            <button
              className="reviews-write-btn"
              onClick={() => {
                if (!token) { setShowAuth(true); return }
                // Ya reseñó: en vez de ofrecerle escribir otra (que el backend
                // ahora rechaza con 409), se le abre la suya para editar.
                if (summary?.my_review) { startEditing(summary.my_review); return }
                setShowForm(true)
              }}
            >
              {summary?.my_review ? "✏️ Editar mi reseña" : "✏️ Escribir una reseña"}
            </button>
          )}
        </div>

        {showForm && (
          <ReviewForm
            editing={editingId !== null}
            rating={rating} setRating={setRating}
            comment={comment} setComment={setComment}
            photoFiles={photoFiles} setPhotoFiles={setPhotoFiles}
            editingPhoto={editingPhoto}
            removingPhoto={removingPhoto}
            onRemovePhoto={removePhoto}
            submitError={submitError}
            submitting={submitting}
            onCancel={closeForm}
            onSubmit={handleSubmit}
          />
        )}

        {photoNotice && (
          <p role="status" style={{ fontSize: 13, margin: "0 0 16px", color: photoNotice.ok ? "#78590a" : "var(--danger)" }}>
            {photoNotice.text}
          </p>
        )}

        {/* Lista */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)", fontSize: 14 }}>
            Cargando...
          </div>
        ) : loadError ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)", fontSize: 14 }}>
            <p style={{ fontSize: 28, marginBottom: 10, opacity: 0.25 }}>⚠️</p>
            <p style={{ margin: "0 0 14px" }}>No se pudieron cargar las reseñas.</p>
            <button
              onClick={() => { setLoading(true); loadReviews() }}
              style={{
                padding: "9px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                fontFamily: "inherit", cursor: "pointer",
                background: "#fff", color: "var(--primary-dark)", border: "1px solid #b7dfc8",
              }}
            >
              Reintentar
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)", fontSize: 14 }}>
            <p style={{ fontSize: 28, marginBottom: 10, opacity: 0.25 }}>💬</p>
            Todavía no hay reseñas. ¡Escribí la primera!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reviews.map(review => (
              <ReviewCard key={review.id} review={review} onEdit={startEditing} onDelete={setDeleteTargetId} onOpenPhoto={setGalleryPhoto} />
            ))}

            {moreError && (
              <p style={{ fontSize: 13, color: "var(--danger)", margin: "6px 0 0", textAlign: "center" }}>
                No se pudieron cargar más reseñas. Probá de nuevo.
              </p>
            )}

            {reviews.length < reviewsTotal && (
              <button
                onClick={loadMoreReviews}
                disabled={loadingMore}
                style={{
                  marginTop: 6, padding: "10px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                  fontFamily: "inherit", cursor: loadingMore ? "default" : "pointer",
                  background: "#fff", color: "var(--primary-dark)", border: "1px solid #b7dfc8",
                  opacity: loadingMore ? 0.6 : 1,
                }}
              >
                {loadingMore ? "Cargando..." : `Ver más reseñas (${reviewsTotal - reviews.length})`}
              </button>
            )}
          </div>
        )}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} reason="dejar tu reseña" />}

      {galleryPhoto && <ImageGallery images={[galleryPhoto]} name="Foto de la reseña" startIndex={0} onClose={() => setGalleryPhoto(null)} />}

      <ConfirmModal
        open={deleteTargetId !== null}
        title="¿Eliminar tu reseña?"
        message="Esta acción no se puede deshacer."
        error={deleteError}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteTargetId(null); setDeleteError(null) }}
      />
    </>
  )
}
