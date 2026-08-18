"use client"

import { useRef } from "react"
import { s, MAX_PHOTOS } from "./styles"
import type { SpotImage } from "./types"

interface Props {
  sortedImages: SpotImage[]
  photoCount: number
  atPhotoLimit: boolean
  photoError: string | null
  uploadingPhotos: boolean
  photoLoading: boolean
  setPhotoError: (v: string | null) => void
  onUploadFiles: (files: File[]) => void
  onSetMain: (publicId: string) => void
  onDeletePhoto: (publicId: string) => void
}

export default function PhotosTab({
  sortedImages, photoCount, atPhotoLimit, photoError, uploadingPhotos, photoLoading,
  setPhotoError, onUploadFiles, onSetMain, onDeletePhoto,
}: Props) {
  const photoUploadRef = useRef<HTMLInputElement>(null)

  return (
    <div style={{ ...s.card, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <p style={{ fontSize: 13, color: "#7a7669", margin: 0 }}>
          {photoCount} de {MAX_PHOTOS} fotos · {atPhotoLimit ? "Límite alcanzado" : `Podés agregar ${MAX_PHOTOS - photoCount} más`}
        </p>
        <button
          onClick={() => { setPhotoError(null); photoUploadRef.current?.click() }}
          disabled={uploadingPhotos || atPhotoLimit}
          style={{
            padding: "7px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: atPhotoLimit ? "not-allowed" : "pointer",
            fontFamily: "inherit", background: atPhotoLimit ? "#f0ede8" : "#2d6a4f",
            color: atPhotoLimit ? "#b0ac9e" : "#fff", border: "none",
            opacity: uploadingPhotos ? 0.6 : 1,
          }}
        >
          {uploadingPhotos ? "Subiendo..." : atPhotoLimit ? "Límite alcanzado" : "+ Agregar fotos"}
        </button>
        <input
          ref={photoUploadRef}
          type="file" accept="image/*" multiple style={{ display: "none" }}
          onChange={e => {
            const files = Array.from(e.target.files ?? [])
            if (files.length) onUploadFiles(files)
          }}
        />
      </div>
      {photoError && (
        <p style={{ fontSize: 13, color: "#dc2626", margin: "0 0 12px" }}>{photoError}</p>
      )}
      <div className="photo-grid">
        {sortedImages.map(img => (
          <div key={img.cloudinary_public_id} className="photo-card">
            <img
              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_280,h_220,c_fill/${img.cloudinary_public_id}`}
              alt=""
            />
            {img.is_main && (
              <div style={{ position: "absolute", top: 6, left: 6, background: "#2d6a4f", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>
                Principal
              </div>
            )}
            <div style={{ padding: "8px 8px 6px", display: "flex", gap: 5 }}>
              {!img.is_main && (
                <button
                  onClick={() => onSetMain(img.cloudinary_public_id)}
                  disabled={photoLoading}
                  style={{ flex: 1, padding: "4px 0", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#e8f5ee", color: "#1b4332", border: "1px solid #b7dfc8" }}
                >
                  Principal
                </button>
              )}
              <button
                onClick={() => onDeletePhoto(img.cloudinary_public_id)}
                disabled={photoLoading}
                style={{ padding: "4px 8px", borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "#dc2626", border: "1px solid #fecaca" }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
