"use client"

// La pestaña "Contenido" del editor: los bloques de la nota, uno abajo del
// otro, cada uno con sus campos. Se mueven con ↑ ↓ y "+" agrega uno debajo.
import { useState } from "react"
import { POINT_TYPES, isSpotPoint, type BlogBlock } from "@/lib/blog"
import { BLOCK_TYPES, move, newBlock, type Draft, type DraftBlock, type SpotLabel } from "@/lib/blogEditor"
import BlogImage from "../BlogImage"
import ImageField from "./ImageField"
import SpotPicker from "./SpotPicker"

type Props = {
  draft: Draft
  update: (fn: (d: Draft) => Draft) => void
  spots: Record<string, SpotLabel>
  addSpot: (spot: SpotLabel) => void
}

const label = (type: BlogBlock["type"]) => BLOCK_TYPES.find(t => t.type === type)?.label ?? type

const FORMAT_HINT = "**negrita**, *cursiva*, [texto](https://link) · una línea que empieza con «- » es una lista · una línea vacía, otro párrafo"

// Qué video es, para avisar antes de guardar (el backend lo vuelve a mirar).
export function videoPlatform(url: string): "youtube" | "instagram" | null {
  try {
    const host = new URL(url).hostname.replace(/^(www|m)\./, "")
    if (host === "youtu.be" || host === "youtube.com" || host === "music.youtube.com") return "youtube"
    if (host === "instagram.com" && /\/(reel|reels|p)\//.test(new URL(url).pathname)) return "instagram"
  } catch { /* todavía no es un link */ }
  return null
}

export default function BlockEditor({ draft, update, spots, addSpot }: Props) {
  const setBlock = (key: string, patch: Partial<BlogBlock>) =>
    update(d => ({ ...d, blocks: d.blocks.map(b => (b.key === key ? ({ ...b, ...patch } as DraftBlock) : b)) }))
  const insertAt = (index: number, type: BlogBlock["type"]) =>
    update(d => {
      const blocks = [...d.blocks]
      blocks.splice(index, 0, newBlock(type, d))
      return { ...d, blocks }
    })

  return (
    <div className="be-blocks">
      {draft.blocks.length === 0 && <AddBlock draft={draft} onAdd={type => insertAt(0, type)} open />}
      {draft.blocks.map((block, i) => (
        <div key={block.key}>
          <section className={`be-card be-block is-${block.type}`} aria-label={`Bloque ${i + 1}: ${label(block.type)}`}>
            <header className="be-block-head">
              <span className="be-block-type">{i + 1} · {label(block.type)}</span>
              <div className="be-row-actions">
                <button type="button" className="be-icon" aria-label="Subir bloque" disabled={i === 0}
                  onClick={() => update(d => ({ ...d, blocks: move(d.blocks, i, -1) }))}>↑</button>
                <button type="button" className="be-icon" aria-label="Bajar bloque" disabled={i === draft.blocks.length - 1}
                  onClick={() => update(d => ({ ...d, blocks: move(d.blocks, i, 1) }))}>↓</button>
                <button type="button" className="be-icon is-danger" aria-label="Borrar bloque"
                  onClick={() => update(d => ({ ...d, blocks: d.blocks.filter(b => b.key !== block.key) }))}>✕</button>
              </div>
            </header>
            <BlockFields block={block} draft={draft} spots={spots} addSpot={addSpot} set={patch => setBlock(block.key, patch)} />
          </section>
          <AddBlock draft={draft} onAdd={type => insertAt(i + 1, type)} open={i === draft.blocks.length - 1} />
        </div>
      ))}
    </div>
  )
}

function AddBlock({ draft, onAdd, open: startOpen = false }: { draft: Draft; onAdd: (type: BlogBlock["type"]) => void; open?: boolean }) {
  const [open, setOpen] = useState(false)
  const shown = open || startOpen
  if (!shown) {
    return (
      <div className="be-add-between">
        <button type="button" className="be-add-toggle" onClick={() => setOpen(true)} aria-label="Agregar un bloque acá">+</button>
      </div>
    )
  }
  return (
    <div className="be-add-menu" role="group" aria-label="Agregar un bloque">
      {BLOCK_TYPES.map(t => {
        const missing = (t.needs === "points" && draft.points.length === 0) || (t.needs === "tracks" && draft.tracks.length === 0)
        return (
          <button key={t.type} type="button" className="be-chip" disabled={missing}
            title={missing ? `Primero agregá ${t.needs === "points" ? "un punto" : "un recorrido"} en «Mapa»` : undefined}
            onClick={() => { onAdd(t.type); setOpen(false) }}>
            + {t.label}
          </button>
        )
      })}
      {open && <button type="button" className="be-chip is-quiet" onClick={() => setOpen(false)}>Cancelar</button>}
    </div>
  )
}

function TextArea({ value, onChange, rows = 4, placeholder, hint = true, ariaLabel }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; hint?: boolean; ariaLabel: string
}) {
  return (
    <>
      <textarea className="be-input be-textarea" value={value} rows={Math.max(rows, value.split("\n").length + 1)}
        onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={ariaLabel} />
      {hint && <small className="be-hint">{FORMAT_HINT}</small>}
    </>
  )
}

function BlockFields({ block, draft, spots, addSpot, set }: {
  block: DraftBlock
  draft: Draft
  spots: Record<string, SpotLabel>
  addSpot: (spot: SpotLabel) => void
  set: (patch: Partial<BlogBlock>) => void
}) {
  switch (block.type) {
    case "heading":
      return (
        <div className="be-inline">
          <select className="be-input be-narrow" value={block.level} aria-label="Tamaño" onChange={e => set({ level: Number(e.target.value) as 2 | 3 })}>
            <option value={2}>Título</option>
            <option value={3}>Subtítulo</option>
          </select>
          <input className={`be-input be-heading-input is-h${block.level}`} value={block.text} maxLength={150} aria-label="Texto del título"
            placeholder="Día 1: de la base al refugio" onChange={e => set({ text: e.target.value })} />
        </div>
      )
    case "text":
      return <TextArea value={block.text} onChange={text => set({ text })} rows={5} ariaLabel="Texto" placeholder="Escribí acá…" />
    case "image":
      return (
        <>
          <ImageField value={block.image || null} onChange={image => set({ image: image ?? "" })} label="Subir foto" />
          <input className="be-input" value={block.caption ?? ""} maxLength={300} placeholder="Epígrafe (opcional)" aria-label="Epígrafe"
            onChange={e => set({ caption: e.target.value || null })} />
          <input className="be-input" value={block.alt ?? ""} maxLength={200} placeholder="Qué se ve en la foto (para lectores de pantalla y Google)" aria-label="Descripción de la foto"
            onChange={e => set({ alt: e.target.value || null })} />
        </>
      )
    case "gallery":
      return (
        <>
          {block.images.length > 0 && (
            <ol className="be-gallery">
              {block.images.map((img, j) => (
                <li key={`${img.image}-${j}`}>
                  <div className="be-gallery-thumb"><BlogImage id={img.image} alt="" width={240} height={180} sizes="120px" /></div>
                  <input className="be-input" value={img.caption ?? ""} placeholder="Epígrafe" aria-label={`Epígrafe de la foto ${j + 1}`} maxLength={300}
                    onChange={e => set({ images: block.images.map((x, k) => (k === j ? { ...x, caption: e.target.value || null } : x)) })} />
                  <div className="be-row-actions">
                    <button type="button" className="be-icon" aria-label={`Mover la foto ${j + 1} antes`} disabled={j === 0} onClick={() => set({ images: move(block.images, j, -1) })}>←</button>
                    <button type="button" className="be-icon" aria-label={`Mover la foto ${j + 1} después`} disabled={j === block.images.length - 1} onClick={() => set({ images: move(block.images, j, 1) })}>→</button>
                    <button type="button" className="be-icon is-danger" aria-label={`Sacar la foto ${j + 1}`} onClick={() => set({ images: block.images.filter((_, k) => k !== j) })}>✕</button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <ImageField value={null} onChange={() => {}} multiple label="Sumar fotos"
            onAdd={ids => set({ images: [...block.images, ...ids.map(image => ({ image, caption: null }))].slice(0, 20) })} />
        </>
      )
    case "point": {
      const exists = draft.points.some(p => p.id === block.point)
      return (
        <>
          <select className="be-input" value={exists ? block.point : ""} aria-label="Punto del mapa" onChange={e => set({ point: e.target.value })}>
            {!exists && <option value="">Elegí un punto…</option>}
            {draft.points.map((p, i) => {
              const name = isSpotPoint(p) ? spots[String(p.spot_id)]?.name ?? `Lugar ${p.spot_id}` : `${POINT_TYPES[p.type]?.emoji ?? ""} ${p.name}`
              return <option key={p.id} value={p.id}>{i + 1}. {name}</option>
            })}
          </select>
          <small className="be-hint">Sale con su número, «Ver en el mapa» y, si es de Rumbo, el link a su página.</small>
          <TextArea value={block.text ?? ""} onChange={text => set({ text: text || null })} rows={4} ariaLabel="Texto del punto" placeholder="Cómo se llega, qué hay, cuánto se tarda…" />
        </>
      )
    }
    case "spot": {
      const spot = block.spot_id ? spots[String(block.spot_id)] : null
      return spot ? (
        <div className="be-inline">
          <p className="be-chosen">📍 <strong>{spot.name}</strong>{spot.department ? ` · ${spot.department}` : ""}
            {spot.available === false && <span className="be-tag is-warn">No publicado: no se ve</span>}
          </p>
          <button type="button" className="be-btn is-quiet" onClick={() => set({ spot_id: 0 })}>Cambiar</button>
        </div>
      ) : (
        <SpotPicker label="Buscar el lugar para la tarjeta" onPick={s => { addSpot(s); set({ spot_id: s.id }) }} />
      )
    }
    case "tip":
      return (
        <>
          <div className="be-inline">
            <select className="be-input be-narrow" value={block.tone} aria-label="Tipo" onChange={e => set({ tone: e.target.value as "tip" | "warning" })}>
              <option value="tip">💡 Consejo</option>
              <option value="warning">⚠️ Atención</option>
            </select>
            <input className="be-input" value={block.title ?? ""} maxLength={100} placeholder="Título (opcional)" aria-label="Título del consejo"
              onChange={e => set({ title: e.target.value || null })} />
          </div>
          <TextArea value={block.text} onChange={text => set({ text })} rows={3} ariaLabel="Texto del consejo" />
        </>
      )
    case "checklist":
      return (
        <>
          <input className="be-input" value={block.title ?? ""} maxLength={100} placeholder="Título (opcional): Qué llevar" aria-label="Título de la lista"
            onChange={e => set({ title: e.target.value || null })} />
          <textarea className="be-input be-textarea" rows={Math.max(4, block.items.length + 1)} value={block.items.join("\n")} aria-label="Cosas de la lista"
            placeholder={"Bolsa de dormir\nLinterna frontal\nAgua (2 litros)"} onChange={e => set({ items: e.target.value.split("\n") })} />
          <small className="be-hint">Una cosa por renglón. Quien lee la puede ir marcando.</small>
        </>
      )
    case "video": {
      const platform = block.url ? videoPlatform(block.url) : null
      return (
        <>
          <input className={`be-input${block.url && !platform ? " is-bad" : ""}`} type="url" value={block.url} aria-label="Link del video"
            placeholder="https://youtu.be/… o https://www.instagram.com/reel/…" onChange={e => set({ url: e.target.value })} />
          {block.url && (
            <small className={platform ? "be-hint" : "be-error"}>
              {platform === "youtube" ? "▶ YouTube: la miniatura sale sola." : platform === "instagram" ? "Reel de Instagram: podés subir una portada (si no, sale con los colores de Instagram)." : "Tiene que ser un video de YouTube o un reel de Instagram."}
            </small>
          )}
          <input className="be-input" value={block.title} maxLength={120} placeholder="Título: Así es la subida al Frey" aria-label="Título del video"
            onChange={e => set({ title: e.target.value })} />
          {platform === "instagram" && (
            <ImageField value={block.cover} onChange={cover => set({ cover })} label="Subir portada" />
          )}
        </>
      )
    }
    case "gpx":
      return (
        <>
          <select className="be-input" value={block.track} aria-label="Recorrido" onChange={e => set({ track: e.target.value })}>
            {!draft.tracks.some(t => t.id === block.track) && <option value="">Elegí un recorrido…</option>}
            {draft.tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <small className="be-hint">Una tarjeta con la distancia, el desnivel y «Descargar GPX».</small>
        </>
      )
  }
}
