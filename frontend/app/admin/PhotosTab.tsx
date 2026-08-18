"use client"

import { useRef, useState } from "react"
import { uploadImageToCloudinary } from "@/lib/uploadImage"
import { api } from "@/lib/api"
import type { AdminSpot } from "./types"

interface Props {
  spots: AdminSpot[]
  token: string | undefined
  searchPhotos: string
  setSearchPhotos: (v: string) => void
  photoSpotId: number | null
  setPhotoSpotId: (id: number | null) => void
  photoLoading: boolean
  onSetMainPhoto: (spotId: number, publicId: string) => Promise<void>
  onDeletePhoto: (spotId: number, publicId: string) => Promise<void>
  onSpotsRefreshed: (spots: AdminSpot[]) => void
}

export default function PhotosTab({
  spots, token, searchPhotos, setSearchPhotos, photoSpotId, setPhotoSpotId,
  photoLoading, onSetMainPhoto, onDeletePhoto, onSpotsRefreshed,
}: Props) {
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const photoUploadRef = useRef<HTMLInputElement>(null)

  const selectedSpot = spots.find(s => s.id === photoSpotId) ?? null

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Buscar spot..."
          value={searchPhotos}
          onChange={e => setSearchPhotos(e.target.value)}
          style={{ width: "100%", maxWidth: 400, padding: "8px 12px", borderRadius: 10, border: "1px solid #e0ddd6", fontSize: 13, fontFamily: "inherit", background: "#fff", marginBottom: 8, display: "block" }}
        />
        <select
          style={{ padding: "9px 12px", borderRadius: 12, border: "1px solid #e0ddd6", fontSize: 14, background: "#fff", fontFamily: "inherit", width: "100%", maxWidth: 400 }}
          value={photoSpotId ?? ""}
          onChange={e => setPhotoSpotId(Number(e.target.value) || null)}
        >
          <option value="">— Seleccioná un spot —</option>
          {spots
            .filter(s => s.name.toLowerCase().includes(searchPhotos.toLowerCase()))
            .map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.category?.name})</option>
            ))}
        </select>
      </div>

      {selectedSpot && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <input
              ref={photoUploadRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={async (e) => {
                if (!selectedSpot) return
                const files = Array.from(e.target.files ?? [])
                if (!files.length) return
                setUploadingPhotos(true)
                try {
                  const results = await Promise.all(files.map((file, i) =>
                    uploadImageToCloudinary(file, {
                      category: selectedSpot.category?.name ?? "Spot",
                      spotName: selectedSpot.name,
                      index: (selectedSpot.images?.length ?? 0) + i,
                      spotId: selectedSpot.id,
                    })
                  ))

                  await Promise.all(results.map(({ publicId }, i) =>
                    api.post(`/images/spots/${selectedSpot.id}`, undefined, {
                      token,
                      params: {
                        cloudinary_public_id: publicId,
                        is_main: false,
                        order: (selectedSpot.images?.length ?? 0) + i,
                      },
                    })
                  ))

                  const { data: updated } = await api.get<AdminSpot[]>("/admin/spots", { token })
                  onSpotsRefreshed(updated)
                } catch {
                  alert("Error al subir fotos")
                } finally {
                  setUploadingPhotos(false)
                  if (photoUploadRef.current) photoUploadRef.current.value = ""
                }
              }}
            />
            <button
              onClick={() => photoUploadRef.current?.click()}
              disabled={uploadingPhotos}
              style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#2d6a4f", color: "#fff", border: "none", opacity: uploadingPhotos ? 0.6 : 1 }}
            >
              {uploadingPhotos ? "Subiendo..." : "+ Agregar fotos"}
            </button>
          </div>

          <p style={{ fontSize: 13, color: "#7a7669", marginBottom: 12 }}>
            {selectedSpot.images.length} foto{selectedSpot.images.length !== 1 ? "s" : ""} · La primera es la principal
          </p>
          <div className="photo-grid">
            {[...selectedSpot.images]
              .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
              .map(img => (
                <div key={img.cloudinary_public_id} className="photo-card">
                  <img
                    src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_280,h_200,c_fill/${img.cloudinary_public_id}`}
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
                        onClick={() => onSetMainPhoto(selectedSpot.id, img.cloudinary_public_id)}
                        disabled={photoLoading}
                        style={{ flex: 1, padding: "4px 0", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#e8f5ee", color: "#1b4332", border: "1px solid #b7dfc8" }}
                      >
                        Hacer principal
                      </button>
                    )}
                    <button
                      onClick={() => onDeletePhoto(selectedSpot.id, img.cloudinary_public_id)}
                      disabled={photoLoading}
                      style={{ padding: "4px 8px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "#dc2626", border: "1px solid #fecaca" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
