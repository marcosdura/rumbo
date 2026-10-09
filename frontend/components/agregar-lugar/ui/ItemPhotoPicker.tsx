"use client"

// Hasta 3 fotos opcionales de una ruta, un sector o una vía, en agregar
// lugar. Se suben después de crearla (submit.ts, itemPhotosTask) y pasan por
// revisión como las que se suben desde su página.
import { useEffect, useMemo, useRef, useState } from "react"
import { s } from "../styles"
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/uploadImage"

export const MAX_ITEM_PHOTOS = 3

export default function ItemPhotoPicker({ files, onChange, label }: {
  files: File[]
  onChange: (files: File[]) => void
  // "Fotos de la ruta"
  label: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const previews = useMemo(() => files.map(f => URL.createObjectURL(f)), [files])
  // Se liberan al cambiar las fotos o al salir del paso.
  useEffect(() => () => previews.forEach(u => URL.revokeObjectURL(u)), [previews])

  function add(list: FileList | null) {
    const chosen = Array.from(list ?? [])
    if (chosen.some(f => !ALLOWED_IMAGE_TYPES.includes(f.type) || f.size > MAX_IMAGE_BYTES)) {
      setError("Solo fotos (JPG, PNG, WEBP o HEIC) de hasta 15 MB.")
      return
    }
    const room = MAX_ITEM_PHOTOS - files.length
    setError(chosen.length > room ? `Hasta ${MAX_ITEM_PHOTOS} fotos.` : null)
    onChange([...files, ...chosen.slice(0, room)])
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 500, color: "#1b1b19", margin: "0 0 2px" }}>{label}</p>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 10px" }}>Opcional, hasta {MAX_ITEM_PHOTOS}. Pasan por revisión antes de publicarse.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {files.map((f, i) => (
          <div key={`${f.name}-${i}`} style={{ position: "relative", width: 88, height: 64, borderRadius: 10, overflow: "hidden" }}>
            {previews[i] && <img src={previews[i]} alt={`${label} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
            <button
              type="button"
              aria-label={`Sacar foto ${i + 1}`}
              onClick={() => { setError(null); onChange(files.filter((_, j) => j !== i)) }}
              style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", lineHeight: 1 }}
            >×</button>
          </div>
        ))}
        {files.length < MAX_ITEM_PHOTOS && (
          <>
            <input ref={inputRef} type="file" accept="image/*" multiple aria-label={label} style={{ display: "none" }} onChange={e => add(e.target.files)} />
            <button type="button" onClick={() => inputRef.current?.click()} style={{ ...s.btnAdd, padding: "6px 12px", fontSize: 12 }}>
              ＋ Agregar foto
            </button>
          </>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: "#e53e3e", margin: "6px 0 0" }}>{error}</p>}
    </div>
  )
}
