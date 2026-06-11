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

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10)
    if ((e.target.files?.length ?? 0) > 10) {
      setError("Podés subir un máximo de 10 imágenes. Se tomaron las primeras 10.")
    } else {
      setError(null)
    }
    setImages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  return (
    <div>
      <h2 style={s.title}>Imágenes</h2>
      <p style={{ color: "#7a7669", fontSize: 14, marginBottom: 16 }}>
        La primera imagen será la principal. Mínimo 1 imagen requerida, máximo 10.
      </p>
      <div style={s.dropzone} onClick={() => fileRef.current?.click()}>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFiles} />
        <span style={{ color: "#7a7669", fontSize: 14 }}>
          {images.length > 0
            ? `${images.length} imagen${images.length !== 1 ? "es" : ""} seleccionada${images.length !== 1 ? "s" : ""}`
            : "Hacé clic para seleccionar imágenes"}
        </span>
      </div>
      {previews.length > 0 && (
        <div style={s.previewGrid}>
          {previews.map((src, i) => (
            <div key={i} style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
              <img src={src} alt={`preview ${i}`} style={s.previewImg} />
              {i === 0 && <span style={s.mainBadge}>Principal</span>}
            </div>
          ))}
        </div>
      )}
      <NavRow onBack={onBack} onNext={onNext} />
    </div>
  )
}
