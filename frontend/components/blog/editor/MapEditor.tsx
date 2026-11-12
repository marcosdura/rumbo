"use client"

// La pestaña "Mapa" del editor: los puntos (lugares de Rumbo y puntos
// libres) en el orden en que se numeran, y los recorridos (GPX). A la
// derecha, el mapa: arrastrar un punto libre lo mueve; "Ubicar en el mapa"
// lo pone donde se haga clic.
import dynamic from "next/dynamic"
import { useCallback, useMemo, useRef, useState } from "react"
import { POINT_TYPES, isSpotPoint, type FreePoint, type MapPoint, type PointType } from "@/lib/blog"
import {
  freePoint, move, parseCoords, removePoint, removeTrack, takenIds, uniqueId,
  type Draft, type SpotLabel,
} from "@/lib/blogEditor"
import { parseGpx, simplify } from "@/lib/gpx"
import ImageField from "./ImageField"
import SpotPicker from "./SpotPicker"

const EditorMap = dynamic(() => import("./EditorMap"), {
  ssr: false,
  loading: () => <div className="blog-map-loading">Cargando mapa…</div>,
})

type Props = {
  draft: Draft
  update: (fn: (d: Draft) => Draft) => void
  spots: Record<string, SpotLabel>
  addSpot: (spot: SpotLabel) => void
}

const TYPES = Object.entries(POINT_TYPES) as [PointType, { label: string; emoji: string }][]

export const coordsText = (p: { lat: number | null; lng: number | null }) =>
  p.lat != null && p.lng != null ? `${p.lat}, ${p.lng}` : ""

export default function MapEditor({ draft, update, spots, addSpot }: Props) {
  const [open, setOpen] = useState<string | null>(null)
  const [placing, setPlacing] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState<PointType>("refugio")
  const [newCoords, setNewCoords] = useState("")
  const [gpxError, setGpxError] = useState<string | null>(null)
  const gpxInput = useRef<HTMLInputElement>(null)

  const setPoint = useCallback((id: string, patch: Partial<FreePoint> | { note: string | null }) => {
    update(d => ({ ...d, points: d.points.map(p => (p.id === id ? ({ ...p, ...patch } as MapPoint) : p)) }))
  }, [update])

  const onPlace = useCallback((id: string, lat: number, lng: number) => {
    setPoint(id, { lat, lng })
    setPlacing(null)
  }, [setPoint])
  const onMove = useCallback((id: string, lat: number, lng: number) => setPoint(id, { lat, lng }), [setPoint])
  const onSelect = useCallback((id: string) => setOpen(id), [])

  // Los puntos como los dibuja el mapa (BlogMap.pinIcon).
  const mapPoints = useMemo(() => draft.points.map((p, i) => {
    if (isSpotPoint(p)) {
      const spot = spots[String(p.spot_id)]
      return { id: p.id, number: i + 1, name: spot?.name ?? `Lugar ${p.spot_id}`, emoji: "📍", lat: spot?.lat ?? null, lng: spot?.lng ?? null, spot: spot ?? {} }
    }
    return { id: p.id, number: i + 1, name: p.name, emoji: POINT_TYPES[p.type]?.emoji ?? "📍", lat: p.lat, lng: p.lng, spot: null }
  }), [draft.points, spots])

  function addFree() {
    const name = newName.trim()
    if (!name) return
    const coords = parseCoords(newCoords)
    // Sin coordenadas: se ubica con un clic en el mapa.
    const point = freePoint(name, newType, coords?.lat ?? (null as unknown as number), coords?.lng ?? (null as unknown as number), takenIds(draft))
    update(d => ({ ...d, points: [...d.points, point] }))
    if (!coords) setPlacing(point.id)
    setOpen(point.id)
    setNewName("")
    setNewCoords("")
  }

  function addRumbo(spot: SpotLabel) {
    addSpot(spot)
    const id = uniqueId(spot.slug || spot.name, takenIds(draft))
    update(d => ({ ...d, points: [...d.points, { id, spot_id: spot.id, note: null }] }))
  }

  async function addGpx(files: FileList | null) {
    setGpxError(null)
    for (const file of Array.from(files ?? [])) {
      const points = parseGpx(await file.text())
      if (!points) {
        setGpxError(`«${file.name}» no es un GPX con un recorrido.`)
        continue
      }
      const name = file.name.replace(/\.gpx$/i, "").replace(/[_-]+/g, " ").trim().slice(0, 80) || "Recorrido"
      update(d => ({ ...d, tracks: [...d.tracks, { id: uniqueId(name, takenIds(d)), name, points: simplify(points) }] }))
    }
    if (gpxInput.current) gpxInput.current.value = ""
  }

  return (
    <div className="be-map-tab">
      <div className="be-map-list">
        <section className="be-card">
          <h2 className="be-h2">Puntos <span className="be-count">{draft.points.length}</span></h2>
          <p className="be-hint">Se numeran en este orden, en el mapa y en el texto.</p>
          {draft.points.length > 0 && (
            <ol className="be-points">
              {draft.points.map((p, i) => {
                const spot = isSpotPoint(p) ? spots[String(p.spot_id)] : null
                const name = isSpotPoint(p) ? spot?.name ?? `Lugar ${p.spot_id}` : p.name
                const unplaced = !isSpotPoint(p) && (p.lat == null || p.lng == null)
                const isOpen = open === p.id
                return (
                  <li key={p.id} className={`be-point${isOpen ? " is-open" : ""}`}>
                    <div className="be-point-row">
                      <span className={`blog-legend-num${isSpotPoint(p) ? " is-rumbo" : ""}`}>{i + 1}</span>
                      <button type="button" className="be-point-name" onClick={() => setOpen(isOpen ? null : p.id)} aria-expanded={isOpen}>
                        {isSpotPoint(p) ? "📍" : POINT_TYPES[p.type]?.emoji} {name}
                        {isSpotPoint(p) && <span className="be-tag is-rumbo">Rumbo</span>}
                        {spot?.available === false && <span className="be-tag is-warn">No publicado: no se ve</span>}
                        {unplaced && <span className="be-tag is-warn">Sin ubicar</span>}
                      </button>
                      <div className="be-row-actions">
                        <button type="button" className="be-icon" onClick={() => update(d => ({ ...d, points: move(d.points, i, -1) }))} disabled={i === 0} aria-label={`Subir ${name}`}>↑</button>
                        <button type="button" className="be-icon" onClick={() => update(d => ({ ...d, points: move(d.points, i, 1) }))} disabled={i === draft.points.length - 1} aria-label={`Bajar ${name}`}>↓</button>
                        <button
                          type="button"
                          className="be-icon is-danger"
                          aria-label={`Sacar ${name}`}
                          onClick={() => {
                            const hasSection = draft.blocks.some(b => b.type === "point" && b.point === p.id)
                            if (hasSection && !window.confirm(`«${name}» tiene su sección en el texto: queda como texto común. ¿Sacarlo del mapa?`)) return
                            update(d => removePoint(d, p.id))
                          }}
                        >✕</button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="be-point-body">
                        {!isSpotPoint(p) && (
                          <>
                            <div className="be-grid2">
                              <label className="be-field">
                                <span>Nombre</span>
                                <input className="be-input" value={p.name} maxLength={80} onChange={e => setPoint(p.id, { name: e.target.value })} />
                              </label>
                              <label className="be-field">
                                <span>Qué es</span>
                                <select className="be-input" value={p.type} onChange={e => setPoint(p.id, { type: e.target.value as PointType })}>
                                  {TYPES.map(([value, t]) => <option key={value} value={value}>{t.emoji} {t.label}</option>)}
                                </select>
                              </label>
                            </div>
                            <CoordsField point={p} onChange={c => setPoint(p.id, c)} />
                            <button type="button" className={`be-btn${placing === p.id ? " is-active" : ""}`} onClick={() => setPlacing(placing === p.id ? null : p.id)}>
                              {placing === p.id ? "Hacé clic en el mapa… (cancelar)" : "🎯 Ubicar en el mapa"}
                            </button>
                            <label className="be-field">
                              <span>Link (web del refugio, reservas…)</span>
                              <input className="be-input" type="url" value={p.url ?? ""} placeholder="https://" onChange={e => setPoint(p.id, { url: e.target.value || null })} />
                            </label>
                            <div className="be-field">
                              <span>Foto (sale en la sección del texto)</span>
                              <ImageField value={p.image} onChange={image => setPoint(p.id, { image })} label="Subir foto" />
                            </div>
                          </>
                        )}
                        {isSpotPoint(p) && spot?.slug && (
                          <p className="be-hint">Lugar de Rumbo: el nombre, la foto y el link salen de su página (<a href={`/spots/${spot.slug}`} target="_blank" rel="noreferrer">/spots/{spot.slug}</a>).</p>
                        )}
                        <label className="be-field">
                          <span>Nota corta (sale en el globo del mapa)</span>
                          <input className="be-input" value={p.note ?? ""} maxLength={300} onChange={e => setPoint(p.id, { note: e.target.value || null })} placeholder="Ej.: agua todo el año, reservar antes" />
                        </label>
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          )}

          <div className="be-add">
            <h3 className="be-h3">Agregar un lugar de Rumbo</h3>
            <SpotPicker onPick={addRumbo} exclude={draft.points.flatMap(p => (isSpotPoint(p) ? [p.spot_id] : []))} />
          </div>

          <div className="be-add">
            <h3 className="be-h3">Agregar un punto libre</h3>
            <p className="be-hint">Para lo que no está en Rumbo: un refugio en Argentina, un mirador, una fuente de agua.</p>
            <div className="be-grid2">
              <input className="be-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre" aria-label="Nombre del punto" maxLength={80}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addFree() } }} />
              <select className="be-input" value={newType} onChange={e => setNewType(e.target.value as PointType)} aria-label="Qué es">
                {TYPES.map(([value, t]) => <option key={value} value={value}>{t.emoji} {t.label}</option>)}
              </select>
            </div>
            <input className="be-input" value={newCoords} onChange={e => setNewCoords(e.target.value)} aria-label="Coordenadas del punto"
              placeholder="Coordenadas (opcional): -41.18, -71.47 o un link de Google Maps" />
            <button type="button" className="be-btn is-primary" onClick={addFree} disabled={!newName.trim()}>
              {parseCoords(newCoords) || !newName.trim() ? "+ Agregar punto" : "+ Agregar y ubicar en el mapa"}
            </button>
          </div>
        </section>

        <section className="be-card">
          <h2 className="be-h2">Recorridos <span className="be-count">{draft.tracks.length}</span></h2>
          <p className="be-hint">Un GPX de Wikiloc, Strava, Garmin… Se ve en el mapa y se puede sumar al texto con un bloque «Recorrido GPX» para descargarlo.</p>
          {draft.tracks.map((t, i) => (
            <div key={t.id} className="be-track">
              <span className="be-track-color" style={{ background: ["#1b4332", "#b5651d", "#3a6ea5", "#8e3b46"][i % 4] }} aria-hidden="true" />
              <input className="be-input" value={t.name} maxLength={80} aria-label="Nombre del recorrido"
                onChange={e => update(d => ({ ...d, tracks: d.tracks.map(x => (x.id === t.id ? { ...x, name: e.target.value } : x)) }))} />
              <span className="be-hint">{t.distance_km != null ? `${t.distance_km.toLocaleString("es-UY")} km` : `${t.points.length} puntos`}</span>
              <button type="button" className="be-icon is-danger" aria-label={`Sacar ${t.name}`} onClick={() => update(d => removeTrack(d, t.id))}>✕</button>
            </div>
          ))}
          <button type="button" className="be-btn" onClick={() => gpxInput.current?.click()}>⬆ Cargar GPX</button>
          <input ref={gpxInput} type="file" accept=".gpx,application/gpx+xml" multiple hidden aria-label="Archivo GPX" onChange={e => addGpx(e.target.files)} />
          {gpxError && <p className="be-error" role="alert">{gpxError}</p>}
        </section>
      </div>

      <div className="be-map-box">
        <EditorMap points={mapPoints} tracks={draft.tracks} placing={placing} selectedId={open} onPlace={onPlace} onMove={onMove} onSelect={onSelect} />
        {placing && <p className="be-map-banner">Hacé clic en el mapa para ubicar el punto</p>}
      </div>
    </div>
  )
}

// Las coordenadas como texto: se pueden pegar de Google Maps. Se aplican al
// salir del campo (o con Enter); si no se entienden, avisa.
function CoordsField({ point, onChange }: { point: FreePoint; onChange: (c: { lat: number; lng: number }) => void }) {
  const current = coordsText(point)
  const [text, setText] = useState<string | null>(null)
  const [bad, setBad] = useState(false)
  const apply = () => {
    if (text === null) return
    const c = parseCoords(text)
    if (c) { onChange(c); setText(null); setBad(false) } else setBad(text.trim() !== "")
  }
  return (
    <label className="be-field">
      <span>Coordenadas</span>
      <input
        className={`be-input${bad ? " is-bad" : ""}`}
        value={text ?? current}
        placeholder="-41.18, -71.47"
        onChange={e => setText(e.target.value)}
        onBlur={apply}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); apply() } }}
      />
      {bad && <small className="be-error">No entiendo esas coordenadas. Ej.: -41.18, -71.47</small>}
    </label>
  )
}
