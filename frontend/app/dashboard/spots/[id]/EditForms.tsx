"use client"

// Correcciones del dueño desde la pestaña de contenido (backend/routers/
// owner_edits.py): rutas, experiencias y alojamientos ya cargados, las
// características del trekking y los servicios del camping y del
// motorhome. Se aplican al instante. Antes solo se podía sumar o borrar.
import { useState, type CSSProperties, type ReactNode } from "react"
import TriStateToggle from "@/components/agregar-lugar/ui/TriStateToggle"
import { ExperienceCard } from "@/components/agregar-lugar/steps/StepExperiencias"
import { GlampingUnitCard } from "@/components/agregar-lugar/steps/StepGlampingUnidades"
import { TREKKING_FEATURES } from "@/components/agregar-lugar/constants"
import { experiencePayload, glampingUnitPayload, missingGlampingFields } from "@/components/agregar-lugar/payloads"
import type { ExperienceItem, GlampingDetailItem } from "@/components/agregar-lugar/types"
import { CAMPING_AMENITY_GROUPS } from "@/lib/camping-filters"
import { s } from "./styles"
import type { OwnedExperience, OwnedGlampingUnit, OwnedRoute } from "./types"

const primaryBtn = (busy: boolean): CSSProperties => ({ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "var(--primary)", color: "#fff", border: "none", opacity: busy ? 0.7 : 1 })
const ghostBtn: CSSProperties = { padding: "8px 14px", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "var(--muted-strong)", border: "1px solid var(--border)" }

// Guardar / Cancelar, con el error abajo.
function Actions({ saving, error, onSave, onCancel, saveLabel = "Guardar" }: {
  saving: boolean; error: string | null; onSave: () => void; onCancel?: () => void; saveLabel?: string
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
      <button type="button" onClick={onSave} disabled={saving} style={primaryBtn(saving)}>{saving ? "Guardando..." : saveLabel}</button>
      {onCancel && <button type="button" onClick={onCancel} style={ghostBtn}>Cancelar</button>}
      {error && <span role="alert" style={{ fontSize: 13, color: "var(--danger)" }}>{error}</span>}
    </div>
  )
}

function useSave(onSave: (payload: object) => Promise<void>) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function run(payload: object | null, invalid?: string) {
    if (!payload) { setError(invalid ?? "Revisá los datos."); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(payload)
    } catch {
      setError("No se pudo guardar. Intentá de nuevo.")
    }
    setSaving(false)
  }
  return { saving, error, run }
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return <div><label style={s.label}>{label}</label>{children}</div>
}

// -------- Ruta de trekking --------

const num = (v: string) => (v.trim() === "" ? null : Number(v))
const str = (v: number | null | undefined) => (v == null ? "" : String(v))

export function RouteEditForm({ route, onSave, onCancel }: { route: OwnedRoute; onSave: (p: object) => Promise<void>; onCancel: () => void }) {
  const [f, setF] = useState({
    name: route.name, distance_km: str(route.distance_km), duration_hours: str(route.duration_hours),
    elevation_gain: str(route.elevation_gain), elevation_loss: str(route.elevation_loss),
    difficulty: route.difficulty ?? "", route_type: route.route_type ?? "", description: route.description ?? "",
  })
  const { saving, error, run } = useSave(onSave)
  const upd = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(p => ({ ...p, [k]: e.target.value }))
  const save = () => run(f.name.trim() ? {
    name: f.name, distance_km: num(f.distance_km), duration_hours: num(f.duration_hours),
    elevation_gain: num(f.elevation_gain), elevation_loss: num(f.elevation_loss),
    difficulty: f.difficulty || null, route_type: f.route_type || null, description: f.description,
  } : null, "La ruta tiene que tener nombre.")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0 4px" }}>
      <Labeled label="Nombre"><input aria-label="Nombre de la ruta" value={f.name} onChange={upd("name")} style={s.input} /></Labeled>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Labeled label="Distancia (km)"><input aria-label="Distancia (km)" type="number" min={0} step="any" value={f.distance_km} onChange={upd("distance_km")} style={s.input} /></Labeled>
        <Labeled label="Duración (horas)"><input aria-label="Duración (horas)" type="number" min={0} step="any" value={f.duration_hours} onChange={upd("duration_hours")} style={s.input} /></Labeled>
        <Labeled label="Desnivel positivo (m)"><input type="number" min={0} value={f.elevation_gain} onChange={upd("elevation_gain")} style={s.input} /></Labeled>
        <Labeled label="Desnivel negativo (m)"><input type="number" min={0} value={f.elevation_loss} onChange={upd("elevation_loss")} style={s.input} /></Labeled>
        <Labeled label="Dificultad">
          <select value={f.difficulty} onChange={upd("difficulty")} style={s.input}>
            <option value="">-</option><option value="fácil">Fácil</option><option value="moderado">Moderado</option><option value="difícil">Difícil</option>
          </select>
        </Labeled>
        <Labeled label="Tipo de ruta">
          <select value={f.route_type} onChange={upd("route_type")} style={s.input}>
            <option value="">-</option><option value="circular">Circular</option><option value="ida y vuelta">Ida y vuelta</option>
          </select>
        </Labeled>
      </div>
      <Labeled label="Descripción">
        <textarea value={f.description} onChange={upd("description")} rows={3} maxLength={2000} style={{ ...s.input, resize: "vertical" }} />
      </Labeled>
      <Actions saving={saving} error={error} onSave={save} onCancel={onCancel} />
    </div>
  )
}

// -------- Experiencia (la misma card que agregar lugar) --------

export function experienceItemFrom(exp: OwnedExperience): ExperienceItem {
  return {
    category_id: String(exp.category?.id ?? exp.category_id ?? ""),
    title: exp.title, description: exp.description ?? "", price: str(exp.price),
    // El horario guardado es un texto: se edita como "personalizado".
    schedule_type: exp.schedule ? "personalizado" : "", schedule_custom: exp.schedule ?? "",
    contact: exp.contact ?? "",
  }
}

export function ExperienceEditForm({ exp, onSave, onCancel }: { exp: OwnedExperience; onSave: (p: object) => Promise<void>; onCancel: () => void }) {
  const [items, setItems] = useState<ExperienceItem[]>([experienceItemFrom(exp)])
  const { saving, error, run } = useSave(onSave)
  function save() {
    // La categoría no se manda ni se exige (sumarla suma la categoría al
    // lugar): solo el título.
    const p = experiencePayload({ ...items[0], category_id: items[0].category_id || "0" })
    run(p ? { title: p.title, description: p.description, price: p.price, schedule: p.schedule, contact: p.contact } : null, "La experiencia tiene que tener título.")
  }
  return (
    <div style={{ padding: "12px 0 4px" }}>
      <p style={{ fontSize: 12, color: "var(--muted-strong)", margin: "0 0 8px" }}>La categoría no se cambia: para otra, sumá una experiencia nueva.</p>
      <ExperienceCard index={0} exp={items[0]} setExperiences={setItems} />
      <Actions saving={saving} error={error} onSave={save} onCancel={onCancel} />
    </div>
  )
}

// -------- Alojamiento de glamping (la misma card que agregar lugar) --------

export function GlampingUnitEditForm({ unit, index, onSave, onCancel }: { unit: OwnedGlampingUnit; index: number; onSave: (p: object) => Promise<void>; onCancel: () => void }) {
  const [item, setItem] = useState<GlampingDetailItem>({
    accommodation_type: unit.accommodation_type ?? "", capacity: str(unit.capacity),
    price_per_night: str(unit.price_per_night), min_nights: str(unit.min_nights),
  })
  const [errors, setErrors] = useState<Set<string>>(new Set())
  const { saving, error, run } = useSave(onSave)
  function save() {
    const missing = missingGlampingFields(item) as Set<string>
    setErrors(missing)
    run(missing.size ? null : glampingUnitPayload(item), "Completá los campos marcados.")
  }
  return (
    <div style={{ padding: "12px 0 4px" }}>
      <GlampingUnitCard index={index} unit={item} errors={errors} onChange={(field, val) => setItem(p => ({ ...p, [field]: val }))} />
      <Actions saving={saving} error={error} onSave={save} onCancel={onCancel} />
    </div>
  )
}

// -------- Características del trekking --------

export function TrekkingFeaturesForm({ initial, onSave }: { initial: Record<string, boolean | null> | null; onSave: (p: object) => Promise<void> }) {
  const [values, setValues] = useState<Record<string, boolean | null>>(
    Object.fromEntries(TREKKING_FEATURES.map(f => [f.key, initial?.[f.key] ?? null])),
  )
  const { saving, error, run } = useSave(onSave)
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {TREKKING_FEATURES.map(f => (
          <div key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, color: "#1b1b19" }}>{f.emoji} {f.label}</span>
            <TriStateToggle value={values[f.key]} onChange={v => setValues(p => ({ ...p, [f.key]: v }))} />
          </div>
        ))}
      </div>
      <Actions saving={saving} error={error} onSave={() => run(values)} saveLabel="Guardar características" />
    </div>
  )
}

// -------- Servicios del camping --------

export function CampingAmenitiesForm({ initial, onSave }: { initial: number[]; onSave: (p: object) => Promise<void> }) {
  const [selected, setSelected] = useState<Set<number>>(new Set(initial))
  const { saving, error, run } = useSave(onSave)
  const toggle = (id: number) => setSelected(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  return (
    <div>
      {CAMPING_AMENITY_GROUPS.map(g => (
        <div key={g.label} style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-strong)", margin: "0 0 6px" }}>{g.label}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {g.amenities.map(a => (
              <button key={a.id} type="button" aria-pressed={selected.has(a.id)} onClick={() => toggle(a.id)} style={s.pill(selected.has(a.id))}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <Actions saving={saving} error={error} onSave={() => run({ amenity_ids: [...selected].sort((x, y) => x - y) })} saveLabel="Guardar servicios" />
    </div>
  )
}

// -------- Servicios para motorhomes --------

const MOTORHOME_SERVICES = [
  { key: "has_water", label: "💧 Agua" },
  { key: "has_electricity", label: "⚡ Electricidad" },
  { key: "has_dump_station", label: "🚽 Vaciado de aguas" },
] as const

export function MotorhomeServicesForm({ initial, onSave }: { initial: Record<string, unknown> | null; onSave: (p: object) => Promise<void> }) {
  const [values, setValues] = useState<Record<string, boolean | null>>(
    Object.fromEntries(MOTORHOME_SERVICES.map(m => [m.key, (initial?.[m.key] as boolean | null | undefined) ?? null])),
  )
  const [capacity, setCapacity] = useState(str(initial?.capacity as number | null))
  const [maxStay, setMaxStay] = useState(str(initial?.max_stay_nights as number | null))
  const { saving, error, run } = useSave(onSave)
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {MOTORHOME_SERVICES.map(m => (
          <div key={m.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, color: "#1b1b19" }}>{m.label}</span>
            <TriStateToggle value={values[m.key]} onChange={v => setValues(p => ({ ...p, [m.key]: v }))} />
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Labeled label="Lugares para motorhomes"><input type="number" min={0} value={capacity} onChange={e => setCapacity(e.target.value)} style={s.input} /></Labeled>
          <Labeled label="Máximo de noches"><input type="number" min={0} value={maxStay} onChange={e => setMaxStay(e.target.value)} style={s.input} /></Labeled>
        </div>
      </div>
      <Actions saving={saving} error={error} onSave={() => run({ ...values, capacity: num(capacity), max_stay_nights: num(maxStay) })} saveLabel="Guardar servicios" />
    </div>
  )
}
