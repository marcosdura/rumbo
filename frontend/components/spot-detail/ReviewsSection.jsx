"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { StarDisplay, StarPicker } from "@/components/ui/StarRating"
import ConfirmModal from "@/components/ui/ConfirmModal"
import AuthModal from "@/components/layout/AuthModal"
import ReportButton from "@/components/ui/ReportButton"
import ItemPhotoPicker from "@/components/agregar-lugar/ui/ItemPhotoPicker"
import ImageGallery from "@/components/spot-detail/ImageGallery"
import { CldImage } from "next-cloudinary"

import { trackEvent } from "@/lib/analytics"
import { timeAgo } from "@/lib/notifications"
import { api } from "@/lib/api"
import { uploadImageToCloudinary } from "@/lib/uploadImage"

function Avatar({ user, size = 36 }) {
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  if (user?.image) {
    return (
      <img
        src={user.image}
        alt={user.name}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #52b788, var(--primary-dark))",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 600, color: "#fff",
    }}>
      {initials}
    </div>
  )
}

const REVIEWS_PAGE_SIZE = 10

export default function ReviewsSection({ spotId }) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState([])
  const [reviewsTotal, setReviewsTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  // null = el form está creando. Con id = está editando esa reseña.
  const [editingId, setEditingId] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  // Un error por operación: cargar la lista no es lo mismo que paginarla,
  // publicar o borrar — cada uno se muestra donde el usuario está mirando.
  const [loadError, setLoadError] = useState(false)
  const [moreError, setMoreError] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  // La foto de la reseña (una, opcional): se sube después de guardarla y
  // pasa por revisión (backend/item_photos.py).
  const [photoFiles, setPhotoFiles] = useState([])
  // Qué pasó con la foto, para avisar arriba de la lista.
  const [photoNotice, setPhotoNotice] = useState(null)
  const [galleryPhoto, setGalleryPhoto] = useState(null)
  const [removingPhoto, setRemovingPhoto] = useState(false)

  const token = session?.id_token

  const basePath = `/reviews/${spotId}`
  const deleteBasePath = "/reviews"

  // El error se limpia recién al cargar bien: mientras reintenta, "Cargando..."
  // tiene prioridad sobre el aviso de error.
  // Con .then y no async/await: el lint de React solo reconoce como
  // asíncrono el setState que va dentro de un callback.
  const loadReviews = () =>
    Promise.all([
      api.get(basePath, { token, params: { limit: REVIEWS_PAGE_SIZE, offset: 0 } }),
      // Con token el summary devuelve además my_review: es la única forma de
      // saber si el usuario ya reseñó, porque su reseña puede estar en una
      // página que todavía no se cargó.
      api.get(`${basePath}/summary`, { token }),
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
      const { data, totalCount } = await api.get(basePath, { token, params: { limit: REVIEWS_PAGE_SIZE, offset: reviews.length } })
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
  const startEditing = (review) => {
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
  const editingPhoto = editingId && summary?.my_review?.id === editingId ? summary.my_review.photo : null

  const uploadPhoto = async (reviewId) => {
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
        await api.patch(`${deleteBasePath}/${editingId}`, { rating, comment }, { token })
      } else {
        const { data } = await api.post(basePath, { rating, comment }, { token })
        reviewId = data.id
        trackEvent("post_review", { entity_type: "spot", rating, spot_id: spotId })
      }
      // La reseña ya quedó: si la foto falla, se avisa sin perderla.
      if (photoFiles.length > 0) {
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
      await api.del(`${deleteBasePath}/${deleteTargetId}`, { token })
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
            {summary?.total > 0 && (
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

        {/* Formulario */}
        {showForm && (
          <div style={{ background: "#f7f5f0", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 10 }}>
              {editingId ? "Editar tu reseña" : "Tu calificación"}
            </p>
            <StarPicker value={rating} onChange={setRating} />
            <textarea
              style={{
                width: "100%", border: "1px solid var(--border)", borderRadius: 12,
                padding: "12px 14px", fontSize: 14, fontFamily: "var(--font-dm-sans), sans-serif",
                color: "#1b1b19", background: "#fff", resize: "none", outline: "none",
                transition: "border-color 0.2s", marginTop: 14, boxSizing: "border-box",
              }}
              rows={3}
              placeholder="Contá tu experiencia (opcional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onFocus={e => e.target.style.borderColor = "var(--primary)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
            <div style={{ marginTop: 14 }}>
              {editingPhoto ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ position: "relative", width: 88, height: 64, borderRadius: 10, overflow: "hidden" }}>
                    <CldImage src={editingPhoto.cloudinary_public_id} alt="La foto de tu reseña" fill sizes="88px" crop="fill" className="object-cover" />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--muted-strong)" }}>{editingPhoto.pending ? "Tu foto está en revisión." : "Tu foto está publicada."}</span>
                  <button type="button" className="text-btn" style={{ fontSize: 12 }} onClick={removePhoto} disabled={removingPhoto}>
                    {removingPhoto ? "Sacando..." : "Sacar la foto"}
                  </button>
                </div>
              ) : (
                <ItemPhotoPicker label="Una foto (opcional)" files={photoFiles} onChange={setPhotoFiles} max={1} />
              )}
            </div>
            {submitError && (
              <p style={{ fontSize: 13, color: "var(--danger)", margin: "12px 0 0" }}>
                {editingId
                  ? "No se pudo guardar el cambio. Revisá tu conexión y probá de nuevo."
                  : "No se pudo publicar la reseña. Revisá tu conexión y probá de nuevo."}
              </p>
            )}
            <div className="reviews-form-actions">
              <button
                style={{
                  padding: "9px 16px", borderRadius: 12, fontSize: 14,
                  fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400,
                  background: "none", color: "var(--muted)", border: "1px solid var(--border)", cursor: "pointer",
                }}
                onClick={closeForm}
              >
                Cancelar
              </button>
              <button
                style={{
                  padding: "9px 20px", borderRadius: 12, fontSize: 14,
                  fontWeight: 600, fontFamily: "var(--font-dm-sans), sans-serif",
                  background: "var(--primary-dark)", color: "#fff", border: "none",
                  cursor: !rating || submitting ? "not-allowed" : "pointer",
                  opacity: !rating || submitting ? 0.45 : 1,
                  transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                onClick={handleSubmit}
                disabled={!rating || submitting}
              >
                {submitting
                  ? "Enviando..."
                  : editingId ? "Guardar cambios" : "Publicar reseña"}
              </button>
            </div>
          </div>
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
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-card-top">
                  <div className="review-card-user">
                    <Avatar user={review.user} />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
                        {review.user?.name || "Usuario"}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        {timeAgo(review.created_at)}
                        {review.updated_at && " · editado"}
                      </p>
                    </div>
                  </div>
                  <div className="review-card-actions">
                    <StarDisplay rating={review.rating} size={14} />
                    {!review.is_mine && (
                      <ReportButton
                        targetKind="review"
                        targetId={review.id}
                        what="esta reseña"
                        className="reviews-edit-btn"
                      />
                    )}
                    {review.is_mine && (
                      <>
                        <button
                          className="reviews-edit-btn"
                          onClick={() => startEditing(review)}
                        >
                          Editar
                        </button>
                        <button
                          className="reviews-delete-btn"
                          onClick={() => setDeleteTargetId(review.id)}
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {review.comment && (
                  <p style={{ fontSize: 14, color: "#3d3d3a", lineHeight: 1.65, marginTop: 10 }}>
                    {review.comment}
                  </p>
                )}
                {review.photo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => setGalleryPhoto(review.photo)}
                      aria-label={`Ver la foto de la reseña de ${review.user?.name || "Usuario"}`}
                      style={{ position: "relative", width: 120, height: 90, borderRadius: 12, overflow: "hidden", border: "none", padding: 0, cursor: "pointer" }}
                    >
                      <CldImage src={review.photo.cloudinary_public_id} alt={`Foto de la reseña de ${review.user?.name || "Usuario"}`} fill sizes="120px" crop="fill" gravity="auto" className="object-cover" loading="lazy" />
                    </button>
                    {review.photo.pending && <span style={{ fontSize: 12, color: "#78590a" }}>⏳ En revisión: solo vos la ves.</span>}
                  </div>
                )}
              </div>
            ))}

            {moreError && (
              <p style={{ fontSize: 13, color: "var(--danger)", margin: "6px 0 0", textAlign: "center" }}>
                No se pudieron cargar más reviews. Probá de nuevo.
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
                {loadingMore ? "Cargando..." : `Ver más reviews (${reviewsTotal - reviews.length})`}
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
