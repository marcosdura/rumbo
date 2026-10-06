"use client"

import { useRef } from "react"
import { s, MAX_PHOTOS } from "./styles"
import type { SpotImage, StagedPhoto } from "./types"

interface Props {
  sortedImages: SpotImage[]
  stagedPhotos: StagedPhoto[]
  pendingPhotoIds: string[]
  photoCount: number
  atPhotoLimit: boolean
  // Hay un pedido de cambio pendiente: no se pueden sumar fotos hasta que se
  // resuelva (un pedido a la vez por spot).
  lockAdd: boolean
  sensitiveReviewed: boolean
  photoError: string | null
  photoLoading: boolean
  setPhotoError: (v: string | null) => void
  onAddFiles: (files: File[]) => void
  onRemoveStaged: (index: number) => void
  onSetMain: (publicId: string) => void
  onDeletePhoto: (publicId: string) => void
}

const cloudinaryThumb = (publicId: string) =>
  `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_280,h_220,c_fill/${publicId}`

// Mismo badge que "Principal", en la paleta yellow de Pill.
const statusBadge = {
  position: "absolute" as const, top: 6, left: 6,
  background: "#fef9e7", color: "#78590a", border: "1px solid #f0d98a",
  fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 6,
}

export default function PhotosTab({
  sortedImages, stagedPhotos, pendingPhotoIds, photoCount, atPhotoLimit, lockAdd, sensitiveReviewed,
  photoError, photoLoading, setPhotoError, onAddFiles, onRemoveStaged, onSetMain, onDeletePhoto,
}: Props) {
  const photoUploadRef = useRef<HTMLInputElement>(null)
  const addDisabled = atPhotoLimit || lockAdd

  return (
    <div style={{ ...s.card, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <p style={{ fontSize: 13, color: "var(--muted-strong)", margin: 0 }}>
          {photoCount} de {MAX_PHOTOS} fotos · {atPhotoLimit ? "Límite alcanzado" : `Podés agregar ${MAX_PHOTOS - photoCount} más`}
        </p>
        <button
          onClick={() => { setPhotoError(null); photoUploadRef.current?.click() }}
          disabled={addDisabled}
          style={{
            padding: "7px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, flexShrink: 0,
            cursor: addDisabled ? "not-allowed" : "pointer",
            fontFamily: "inherit", background: addDisabled ? "#f0ede8" : "var(--primary)",
            color: addDisabled ? "#b0ac9e" : "#fff", border: "none",
          }}
        >
          {lockAdd ? "Cambio en revisión" : atPhotoLimit ? "Límite alcanzado" : "+ Agregar fotos"}
        </button>
        <input
          ref={photoUploadRef}
          type="file" accept="image/*" multiple style={{ display: "none" }}
          onChange={e => {
            const files = Array.from(e.target.files ?? [])
            if (files.length) onAddFiles(files)
            e.target.value = ""
          }}
        />
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 4px", lineHeight: 1.5 }}>
        Borrar una foto o elegir la principal se aplica al instante.
        {stagedPhotos.length > 0 && ` Las fotos nuevas se suben al tocar "Guardar cambios"${sensitiveReviewed ? " y pasan por revisión" : ""}.`}
      </p>
      {photoError && (
        <p style={{ fontSize: 13, color: "var(--danger)", margin: "8px 0 0" }}>{photoError}</p>
      )}
      <div className="photo-grid">
        {sortedImages.map(img => (
          <div key={img.cloudinary_public_id} className="photo-card">
            <img src={cloudinaryThumb(img.cloudinary_public_id)} alt="" />
            {img.is_main && (
              <div style={{ position: "absolute", top: 6, left: 6, background: "var(--primary)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>
                Principal
              </div>
            )}
            <div style={{ padding: "8px 8px 6px", display: "flex", gap: 5 }}>
              {!img.is_main && (
                <button
                  onClick={() => onSetMain(img.cloudinary_public_id)}
                  disabled={photoLoading}
                  style={{ flex: 1, padding: "4px 0", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#e8f5ee", color: "var(--primary-dark)", border: "1px solid #b7dfc8" }}
                >
                  Principal
                </button>
              )}
              <button
                onClick={() => onDeletePhoto(img.cloudinary_public_id)}
                disabled={photoLoading}
                aria-label="Eliminar foto"
                style={{ padding: "4px 8px", borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "var(--danger)", border: "1px solid #fecaca" }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        {pendingPhotoIds.map(publicId => (
          <div key={publicId} className="photo-card">
            <img src={cloudinaryThumb(publicId)} alt="" style={{ opacity: 0.7 }} />
            <div style={statusBadge}>En revisión</div>
          </div>
        ))}

        {stagedPhotos.map((photo, i) => (
          <div key={photo.url} className="photo-card">
            <img src={photo.url} alt="" />
            <div style={statusBadge}>Sin guardar</div>
            {/* Misma × que las previews de agregar-lugar (StepImagenes). */}
            <button
              type="button"
              onClick={() => onRemoveStaged(i)}
              aria-label="Quitar foto"
              style={{
                position: "absolute", top: 4, right: 4,
                background: "rgba(0,0,0,0.55)", color: "#fff",
                border: "none", borderRadius: "50%",
                width: 20, height: 20, cursor: "pointer",
                fontSize: 13, display: "flex", alignItems: "center",
                justifyContent: "center", fontFamily: "inherit", lineHeight: 1,
              }}
            >×</button>
          </div>
        ))}
      </div>
    </div>
  )
}
