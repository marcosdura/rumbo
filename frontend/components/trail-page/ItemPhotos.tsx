"use client"

// Fotos de una ruta de trekking, un sector o una vía (backend/item_photos.py),
// con el botón para subir. Hasta 3; las sube cualquiera con sesión y pasan
// por revisión del admin. Si no tiene ninguna, invita a subir las primeras.
import { useState } from "react"
import { CldImage } from "next-cloudinary"
import { useSession } from "next-auth/react"
import ConfirmModal from "@/components/ui/ConfirmModal"
import AuthModal from "@/components/layout/AuthModal"
import ImageGallery from "@/components/spot-detail/ImageGallery"
import { api, ApiError } from "@/lib/api"
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, uploadImageToCloudinary } from "@/lib/uploadImage"
import type { ItemPhoto, PhotoTarget } from "@/lib/trailPage"

const Gallery = ImageGallery as unknown as (p: { images: ItemPhoto[]; name: string; startIndex: number; onClose: () => void }) => React.ReactElement

const addButton = {
  padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
  border: "1px solid var(--border)", background: "#fff", color: "var(--primary)", cursor: "pointer", whiteSpace: "nowrap" as const,
}

type Props = {
  photos: ItemPhoto[]
  // Cuántas más se pueden subir (3 menos las publicadas y en revisión).
  slots: number
  target: PhotoTarget
  targetId: number
  spotId: number
  name: string
  // "Esta ruta todavía no tiene fotos. ¿La hiciste?"
  emptyText: string
}

export default function ItemPhotos({ photos, slots, target, targetId, spotId, name, emptyText }: Props) {
  const { data: session } = useSession()
  const token = session?.id_token
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Recién subidas: quedan en revisión.
  const [sent, setSent] = useState(0)
  const free = slots - sent

  function start() {
    if (!token) { setShowAuth(true); return }
    setFiles([])
    setError(null)
    setOpen(true)
  }

  function pick(list: FileList | null) {
    const chosen = Array.from(list ?? [])
    const bad = chosen.find(f => !ALLOWED_IMAGE_TYPES.includes(f.type) || f.size > MAX_IMAGE_BYTES)
    if (bad) { setError("Solo fotos (JPG, PNG, WEBP o HEIC) de hasta 15 MB."); return }
    setError(chosen.length > free ? `Podés subir hasta ${free} ${free === 1 ? "foto" : "fotos"} más.` : null)
    setFiles(chosen.slice(0, free))
  }

  async function send() {
    if (files.length === 0) { setError("Elegí al menos una foto."); return }
    setSending(true)
    setError(null)
    try {
      const uploaded = await Promise.all(files.map(f => uploadImageToCloudinary(f, { spotId })))
      await api.post("/photos", { target, target_id: targetId, public_ids: uploaded.map(u => u.publicId) }, { token })
      setSent(n => n + files.length)
      setOpen(false)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudieron subir las fotos. Intentá de nuevo.")
    } finally {
      setSending(false)
    }
  }

  const uploadButton = free > 0 && (
    <button type="button" style={addButton} onClick={start}>＋ {photos.length ? "Sumar fotos" : "Subir fotos"}</button>
  )

  return (
    <div>
      {photos.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setGalleryIndex(i)}
              aria-label={`Ver foto ${i + 1} de ${name}`}
              style={{ position: "relative", height: 140, borderRadius: 12, overflow: "hidden", border: "none", padding: 0, cursor: "pointer" }}
            >
              <CldImage src={p.cloudinary_public_id} alt={`${name} ${i + 1}`} fill sizes="240px" crop="fill" gravity="auto" className="object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 14, color: "var(--muted-strong)", margin: 0, lineHeight: 1.5 }}>
          {/* Sin lugar para más: las que hay están en revisión. */}
          {free > 0 || sent > 0 ? emptyText : "Hay fotos en revisión: se publican cuando el equipo de Rumbo las apruebe."}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
        {uploadButton}
        {sent > 0 && (
          <span role="status" style={{ fontSize: 13, color: "#78590a" }}>
            ⏳ ¡Gracias! {sent === 1 ? "Tu foto queda" : "Tus fotos quedan"} en revisión y se publican cuando el equipo de Rumbo las apruebe.
          </span>
        )}
      </div>

      <ConfirmModal
        open={open}
        title={`Fotos de ${name}`}
        confirmLabel={files.length > 1 ? `Subir ${files.length} fotos` : "Subir foto"}
        confirmVariant="primary"
        loading={sending}
        loadingLabel="Subiendo..."
        error={error}
        onCancel={() => setOpen(false)}
        onConfirm={send}
      >
        <p style={{ fontSize: 14, color: "#4a4a46", lineHeight: 1.6, margin: "8px 0 12px" }}>
          Podés subir hasta {free} {free === 1 ? "foto" : "fotos"}. Pasan por revisión antes de publicarse.
        </p>
        <input
          type="file"
          accept="image/*"
          multiple={free > 1}
          aria-label="Elegir fotos"
          onChange={e => pick(e.target.files)}
        />
        {files.length > 0 && (
          <p style={{ fontSize: 13, color: "var(--muted-strong)", margin: "10px 0 0" }}>
            {files.map(f => f.name).join(", ")}
          </p>
        )}
      </ConfirmModal>

      {galleryIndex !== null && <Gallery images={photos} name={name} startIndex={galleryIndex} onClose={() => setGalleryIndex(null)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
