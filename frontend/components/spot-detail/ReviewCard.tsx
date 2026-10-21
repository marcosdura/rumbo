"use client"

// Una reseña de la lista (ReviewsSection): quién, cuándo, las estrellas, el
// texto y su foto. La propia se edita o borra; las de otros se reportan.
import { CldImage } from "next-cloudinary"
import { StarDisplay } from "@/components/ui/StarRating"
import ReportButton from "@/components/ui/ReportButton"
import { timeAgo } from "@/lib/notifications"

export type ReviewPhoto = { id: number; cloudinary_public_id: string; pending: boolean }

export type Review = {
  id: number
  rating: number
  comment: string | null
  created_at: string
  // Con valor = se editó ("editado").
  updated_at?: string | null
  user?: { name?: string | null; image?: string | null }
  is_mine?: boolean
  photo?: ReviewPhoto | null
}

function Avatar({ user, size = 36 }: { user?: Review["user"]; size?: number }) {
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  if (user?.image) {
    return (
      // El avatar de Google (lh3.googleusercontent.com): no pasa por next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image}
        alt={user.name ?? ""}
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

export default function ReviewCard({ review, onEdit, onDelete, onOpenPhoto }: {
  review: Review
  onEdit: (review: Review) => void
  onDelete: (id: number) => void
  onOpenPhoto: (photo: ReviewPhoto) => void
}) {
  const author = review.user?.name || "Usuario"
  return (
    <div className="review-card">
      <div className="review-card-top">
        <div className="review-card-user">
          <Avatar user={review.user} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0 }}>{author}</p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              {timeAgo(review.created_at)}
              {review.updated_at && " · editado"}
            </p>
          </div>
        </div>
        <div className="review-card-actions">
          <StarDisplay rating={review.rating} size={14} />
          {review.is_mine ? (
            <>
              <button className="reviews-edit-btn" onClick={() => onEdit(review)}>Editar</button>
              <button className="reviews-delete-btn" onClick={() => onDelete(review.id)}>Eliminar</button>
            </>
          ) : (
            <ReportButton targetKind="review" targetId={review.id} what="esta reseña" className="reviews-edit-btn" />
          )}
        </div>
      </div>
      {review.comment && (
        <p style={{ fontSize: 14, color: "#3d3d3a", lineHeight: 1.65, marginTop: 10 }}>{review.comment}</p>
      )}
      {review.photo && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <button
            type="button"
            onClick={() => onOpenPhoto(review.photo!)}
            aria-label={`Ver la foto de la reseña de ${author}`}
            style={{ position: "relative", width: 120, height: 90, borderRadius: 12, overflow: "hidden", border: "none", padding: 0, cursor: "pointer" }}
          >
            <CldImage src={review.photo.cloudinary_public_id} alt={`Foto de la reseña de ${author}`} fill sizes="120px" crop="fill" gravity="auto" className="object-cover" loading="lazy" />
          </button>
          {review.photo.pending && <span style={{ fontSize: 12, color: "#78590a" }}>⏳ En revisión: solo vos la ves.</span>}
        </div>
      )}
    </div>
  )
}
