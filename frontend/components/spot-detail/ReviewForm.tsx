"use client"

// El formulario de una reseña (ReviewsSection): estrellas, texto y una foto
// opcional. Sirve para escribir una nueva y para editar la propia (con su
// foto, que se puede sacar).
import { CldImage } from "next-cloudinary"
import { StarPicker } from "@/components/ui/StarRating"
import ItemPhotoPicker from "@/components/agregar-lugar/ui/ItemPhotoPicker"
import type { ReviewPhoto } from "./ReviewCard"

export default function ReviewForm({
  editing, rating, setRating, comment, setComment, photoFiles, setPhotoFiles,
  editingPhoto, removingPhoto, onRemovePhoto, submitError, submitting, onCancel, onSubmit,
}: {
  editing: boolean
  rating: number
  setRating: (rating: number) => void
  comment: string
  setComment: (comment: string) => void
  photoFiles: File[]
  setPhotoFiles: (files: File[]) => void
  // La foto que ya tiene la reseña que se edita (publicada o en revisión).
  editingPhoto: ReviewPhoto | null
  removingPhoto: boolean
  onRemovePhoto: () => void
  submitError: boolean
  submitting: boolean
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <div style={{ background: "#f7f5f0", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
      <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 10 }}>
        {editing ? "Editar tu reseña" : "Tu calificación"}
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
        onChange={e => setComment(e.target.value)}
        onFocus={e => { e.target.style.borderColor = "var(--primary)" }}
        onBlur={e => { e.target.style.borderColor = "var(--border)" }}
      />
      <div style={{ marginTop: 14 }}>
        {editingPhoto ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 88, height: 64, borderRadius: 10, overflow: "hidden" }}>
              <CldImage src={editingPhoto.cloudinary_public_id} alt="La foto de tu reseña" fill sizes="88px" crop="fill" className="object-cover" />
            </div>
            <span style={{ fontSize: 12, color: "var(--muted-strong)" }}>{editingPhoto.pending ? "Tu foto está en revisión." : "Tu foto está publicada."}</span>
            <button type="button" className="text-btn" style={{ fontSize: 12 }} onClick={onRemovePhoto} disabled={removingPhoto}>
              {removingPhoto ? "Sacando..." : "Sacar la foto"}
            </button>
          </div>
        ) : (
          <ItemPhotoPicker label="Una foto (opcional)" files={photoFiles} onChange={setPhotoFiles} max={1} />
        )}
      </div>
      {submitError && (
        <p style={{ fontSize: 13, color: "var(--danger)", margin: "12px 0 0" }}>
          {editing
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
          onClick={onCancel}
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
          onClick={onSubmit}
          disabled={!rating || submitting}
        >
          {submitting ? "Enviando..." : editing ? "Guardar cambios" : "Publicar reseña"}
        </button>
      </div>
    </div>
  )
}
