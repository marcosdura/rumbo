"use client"

import { useRef } from "react"
import type React from "react"
import { s } from "../styles"
import NavRow from "../ui/NavRow"

export default function StepImagenes({
  images, setImages, previews, setPreviews, setError, error, onBack, onNext,
}: {
  images: File[]
  setImages: React.Dispatch<React.SetStateAction<File[]>>
  previews: string[]
  setPreviews: React.Dispatch<React.SetStateAction<string[]>>
  setError: (v: string | null) => void
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  // Espejo de allowed_formats en app/api/upload/signature/route.ts — esto es
  // solo UX (falla rápido antes de comprimir/subir), la validación real que
  // no se puede saltear está firmada del lado de Cloudinary.
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]
  const MAX_FILE_BYTES = 15 * 1024 * 1024 // 15MB antes de comprimir

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? [])

    const valid = incoming.filter(f => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_FILE_BYTES)
    const rejected = incoming.length - valid.length

    setImages(prev => {
      const combined = [...prev, ...valid].slice(0, 10)
      if (rejected > 0) {
        setError(`${rejected} archivo${rejected !== 1 ? "s" : ""} no se pudo agregar: solo se aceptan imágenes (JPG, PNG, WEBP, GIF, HEIC) de hasta 15MB.`)
      } else if (prev.length + valid.length > 10) {
        setError("Límite de 10 imágenes. Se tomaron las primeras 10.")
      } else {
        setError(null)
      }
      setPreviews(combined.map(f => URL.createObjectURL(f)))
      return combined
    })
    e.target.value = ""
  }

  function removeImage(index: number) {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== index)
      setPreviews(next.map(f => URL.createObjectURL(f)))
      return next
    })
  }

  function makeMain(index: number) {
    setImages(prev => {
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.unshift(item)
      setPreviews(next.map(f => URL.createObjectURL(f)))
      return next
    })
  }

  return (
    <div>
      <h2 style={s.title}>Imágenes</h2>
      <p style={s.subtitle}>
        La primera imagen será la principal. Mínimo 1 requerida, máximo 10.
      </p>

      {images.length < 10 && (
        <div style={s.dropzone} onClick={() => fileRef.current?.click()}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleFiles}
          />
          <span style={{ color: "var(--muted-strong)", fontSize: 14 }}>
            {images.length > 0
              ? `+ Agregar más imágenes (${images.length}/10)`
              : "Hacé clic para seleccionar imágenes"}
          </span>
        </div>
      )}

      {previews.length > 0 && (
        <div style={s.previewGrid}>
          {previews.map((src, i) => (
            <div key={i} style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
              <img src={src} alt={`preview ${i}`} style={s.previewImg} />
              {i === 0 && <span style={s.mainBadge}>Principal</span>}
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => makeMain(i)}
                  style={{
                    position: "absolute", bottom: 4, left: 4,
                    background: "rgba(0,0,0,0.55)", color: "#fff",
                    border: "none", borderRadius: 6,
                    padding: "2px 7px", cursor: "pointer",
                    fontSize: 10, fontWeight: 600,
                    fontFamily: "inherit", lineHeight: 1.4,
                  }}
                >
                  Hacer principal
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
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
      )}

      <NavRow
        onBack={onBack}
        onNext={() => {
          if (images.length === 0) {
            setError("Debés subir al menos una imagen para continuar.")
            return
          }
          onNext()
        }}
        error={error}
      />
    </div>
  )
}
