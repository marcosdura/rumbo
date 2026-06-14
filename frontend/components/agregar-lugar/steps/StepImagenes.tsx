"use client"

import { useRef } from "react"
import type React from "react"
import { s } from "../styles"
import NavRow from "../ui/NavRow"
import FocalPointPicker from "../../ui/FocalPointPicker"

export default function StepImagenes({
  images, setImages, previews, setPreviews, focalPoints, setFocalPoints,
  setError, error, onBack, onNext, stepLabel,
}: {
  images: File[]
  setImages: React.Dispatch<React.SetStateAction<File[]>>
  previews: string[]
  setPreviews: React.Dispatch<React.SetStateAction<string[]>>
  focalPoints: { x: number; y: number }[]
  setFocalPoints: React.Dispatch<React.SetStateAction<{ x: number; y: number }[]>>
  setError: (v: string | null) => void
  error: string | null
  onBack: () => void
  onNext: () => void
  stepLabel?: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? [])
    setImages(prev => {
      const combined = [...prev, ...incoming].slice(0, 10)
      if (prev.length + incoming.length > 10) {
        setError("Límite de 10 imágenes. Se tomaron las primeras 10.")
      } else {
        setError(null)
      }
      setPreviews(combined.map(f => URL.createObjectURL(f)))
      setFocalPoints(prevFP => {
        const next = [...prevFP]
        while (next.length < combined.length) next.push({ x: 0.5, y: 0.5 })
        return next.slice(0, combined.length)
      })
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
    setFocalPoints(prev => prev.filter((_, i) => i !== index))
  }

  function makeMain(index: number) {
    setImages(prev => {
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.unshift(item)
      setPreviews(next.map(f => URL.createObjectURL(f)))
      return next
    })
    setFocalPoints(prev => {
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.unshift(item)
      return next
    })
  }

  return (
    <div>
      <NavRow onBack={onBack} onNext={onNext} error={null} stepLabel={stepLabel} />
      <h2 style={s.title}>Imágenes</h2>
      <p style={{ color: "#7a7669", fontSize: 14, marginBottom: 16 }}>
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
          <span style={{ color: "#7a7669", fontSize: 14 }}>
            {images.length > 0
              ? `+ Agregar más imágenes (${images.length}/10)`
              : "Hacé clic para seleccionar imágenes"}
          </span>
        </div>
      )}

      {previews.length > 0 && (
        <div style={s.previewGrid}>
          {previews.map((src, i) => (
            <div key={i}>
              <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
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
              {i === 0 && (
                <>
                  <FocalPointPicker
                    imageUrl={src}
                    focalX={focalPoints[0]?.x ?? 0.5}
                    focalY={focalPoints[0]?.y ?? 0.5}
                    onChange={(x, y) => setFocalPoints(prev => {
                      const next = [...prev]
                      next[0] = { x, y }
                      return next
                    })}
                  />
                  <div style={{ marginTop: 8 }}>
                    <p style={{
                      fontSize: 11,
                      color: "#7a7669",
                      marginBottom: 6,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      Así se vería en la card:
                    </p>
                    <div style={{
                      width: "100%",
                      height: 120,
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid #e0ddd6",
                    }}>
                      <img
                        src={src}
                        alt="preview card"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: `${(focalPoints[0]?.x ?? 0.5) * 100}% ${(focalPoints[0]?.y ?? 0.5) * 100}%`,
                          display: "block",
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
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
        stepLabel={stepLabel}
      />
    </div>
  )
}
