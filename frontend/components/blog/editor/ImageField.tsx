"use client"

// Una foto de la nota (tapa, foto, galería, portada de un reel): se sube a
// Cloudinary (rumbo/blog) y queda su public_id.
import { useRef, useState } from "react"
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, uploadBlogImage } from "@/lib/uploadImage"
import BlogImage from "../BlogImage"

type Props = {
  value: string | null
  onChange: (id: string | null) => void
  label: string
  // Varias a la vez (galería): onAdd recibe cada una.
  multiple?: boolean
  onAdd?: (ids: string[]) => void
}

export async function uploadAll(files: File[]): Promise<string[]> {
  const valid = files.filter(f => ALLOWED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_IMAGE_BYTES)
  if (valid.length < files.length) throw new Error("Alguna foto no es una imagen o pesa más de 15 MB.")
  const ids: string[] = []
  for (const file of valid) ids.push((await uploadBlogImage(file)).publicId)
  return ids
}

export default function ImageField({ value, onChange, label, multiple = false, onAdd }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pick(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    setError(null)
    try {
      const ids = await uploadAll(Array.from(files))
      if (multiple && onAdd) onAdd(ids)
      else onChange(ids[0] ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la foto.")
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ""
    }
  }

  return (
    <div className="be-image">
      {value && !multiple && (
        <div className="be-image-thumb">
          <BlogImage id={value} alt="" width={320} height={200} sizes="160px" />
        </div>
      )}
      <div className="be-image-actions">
        <button type="button" className="be-btn" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? "Subiendo…" : value && !multiple ? "Cambiar foto" : `📷 ${label}`}
        </button>
        {value && !multiple && (
          <button type="button" className="be-btn is-quiet" onClick={() => onChange(null)} disabled={busy}>Quitar</button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        multiple={multiple}
        hidden
        aria-label={label}
        onChange={e => pick(e.target.files)}
      />
      {error && <p className="be-error" role="alert">{error}</p>}
    </div>
  )
}
