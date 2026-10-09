"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Pill from "@/components/ui/Pill"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { api } from "@/lib/api"
import { ExperienceCard } from "@/components/agregar-lugar/steps/StepExperiencias"
import { GlampingUnitCard } from "@/components/agregar-lugar/steps/StepGlampingUnidades"
import { defaultExperience, defaultGlampingDetail } from "@/components/agregar-lugar/constants"
import { experiencePayload, glampingUnitPayload, missingGlampingFields } from "@/components/agregar-lugar/payloads"
import { addToSpotUrl } from "@/components/agregar-lugar/prefill"
import type { ExperienceItem, GlampingDetailItem } from "@/components/agregar-lugar/types"
import { s } from "./styles"
import { errorMessage } from "./changes"
import type { OwnerContent } from "./types"
import {
  CampingAmenitiesForm, ExperienceEditForm, GlampingUnitEditForm, MotorhomeServicesForm, RouteEditForm, TrekkingFeaturesForm,
} from "./EditForms"

interface Props {
  spotId: number
  token: string | undefined
  // El spot ya está aprobado: lo nuevo pasa por revisión.
  reviewed: boolean
  category: string | null
  showExperiences: boolean
  showGlamping: boolean
  // Actividades del lugar: qué servicios se corrigen acá (camping, motorhome).
  activities?: string[]
}

const ACCOMMODATION_LABELS: Record<string, string> = {
  domo: "Domo", carpa: "Carpa equipada", cabaña: "Cabaña", treehouse: "Treehouse", otro: "Otro",
}

// Mismo encabezado de sección que InfoTab.
const sectionTitle = { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--primary)", margin: "0 0 12px" }
const emptyText = { fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }
// Mismo botón primario que "Guardar cambios".
const primaryBtn = (busy: boolean) => ({ padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "var(--primary)", color: "#fff", border: "none", opacity: busy ? 0.7 : 1 })
// Mismo ✕ que borrar una foto.
const deleteBtn = { padding: "4px 8px", borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "var(--danger)", border: "1px solid #fecaca", flexShrink: 0 }
const addBtn = { padding: "7px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#f7f5f0", color: "#3d3d3a", border: "1px solid var(--border)" }
// Mismo botón, como link a agregar-lugar ya posicionado en el formulario.
const addLink = { ...addBtn, display: "inline-block", textDecoration: "none" }

export function savedMessage(created: { is_approved?: boolean }[]) {
  return created.some(c => c.is_approved === false)
    ? "✓ Guardado. Queda en revisión hasta que el equipo de Rumbo lo apruebe."
    : "✓ Guardado correctamente"
}

// Qué se está por borrar: cada elemento sabe su endpoint.
type ToDelete = { url: string; title: string; pending: boolean; note?: string }

export default function ContentTab({ spotId, token, reviewed, category, showExperiences, showGlamping, activities = [] }: Props) {
  const [content, setContent] = useState<OwnerContent | null>(null)
  // Lo que se está corrigiendo ("route-3", "exp-5"...) y el último guardado.
  const [editing, setEditing] = useState<string | null>(null)
  const [editMsg, setEditMsg] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [expDrafts, setExpDrafts] = useState<ExperienceItem[]>([])
  const [expSaving, setExpSaving] = useState(false)
  const [expMsg, setExpMsg] = useState<string | null>(null)
  const [expError, setExpError] = useState<string | null>(null)

  const [unitDrafts, setUnitDrafts] = useState<GlampingDetailItem[]>([])
  const [unitErrors, setUnitErrors] = useState<Record<number, Set<string>>>({})
  const [unitSaving, setUnitSaving] = useState(false)
  const [unitMsg, setUnitMsg] = useState<string | null>(null)
  const [unitError, setUnitError] = useState<string | null>(null)

  const [toDelete, setToDelete] = useState<ToDelete | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function load() {
    try {
      const { data } = await api.get<OwnerContent>(`/spots/${spotId}/owner-content`, { token })
      setContent(data)
      setLoadError(null)
    } catch {
      setLoadError("No se pudo cargar. Recargá la página.")
    }
  }

  useEffect(() => {
    if (token) load()
  }, [token, spotId])

  async function saveExperiences() {
    setExpMsg(null)
    setExpError(null)
    const payloads = expDrafts.map(experiencePayload)
    if (payloads.some(p => p === null)) {
      setExpError("Completá la categoría y el título de cada experiencia.")
      return
    }
    setExpSaving(true)
    const created: { is_approved?: boolean }[] = []
    const failed: ExperienceItem[] = []
    let lastError: unknown = null
    for (let i = 0; i < expDrafts.length; i++) {
      try {
        const { data } = await api.post<{ is_approved?: boolean }>(`/spots/${spotId}/experiences`, payloads[i], { token })
        created.push(data)
      } catch (e) {
        failed.push(expDrafts[i])
        lastError = e
      }
    }
    // Las que fallaron quedan en el formulario para reintentar.
    setExpDrafts(failed)
    if (created.length) setExpMsg(savedMessage(created))
    if (failed.length) setExpError(errorMessage(lastError, "No se pudieron guardar algunas experiencias. Intentá de nuevo."))
    setExpSaving(false)
    await load()
  }

  async function saveUnits() {
    setUnitMsg(null)
    setUnitError(null)
    const errors: Record<number, Set<string>> = {}
    unitDrafts.forEach((unit, i) => {
      const missing = missingGlampingFields(unit) as Set<string>
      if (missing.size) errors[i] = missing
    })
    setUnitErrors(errors)
    if (Object.keys(errors).length) return
    setUnitSaving(true)
    const created: { is_approved?: boolean }[] = []
    const failed: GlampingDetailItem[] = []
    let lastError: unknown = null
    for (const unit of unitDrafts) {
      try {
        const { data } = await api.post<{ is_approved?: boolean }>(`/glamping/spots/${spotId}/glamping`, glampingUnitPayload(unit), { token })
        created.push(data)
      } catch (e) {
        failed.push(unit)
        lastError = e
      }
    }
    setUnitDrafts(failed)
    if (created.length) setUnitMsg(savedMessage(created))
    if (failed.length) setUnitError(errorMessage(lastError, "No se pudieron guardar algunas unidades. Intentá de nuevo."))
    setUnitSaving(false)
    await load()
  }

  // Corregir algo ya cargado: se aplica al instante (owner_edits.py).
  function saveEdit(method: "patch" | "put", url: string, what: string) {
    return async (payload: object) => {
      await api[method](url, payload, { token })
      setEditing(null)
      setEditMsg(`✓ ${what}: guardado`)
      await load()
    }
  }

  function askDelete(target: ToDelete) {
    setDeleteError(null)
    setToDelete(target)
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await api.del(toDelete.url, { token })
      setToDelete(null)
      await load()
    } catch {
      setDeleteError("No se pudo eliminar. Intentá de nuevo.")
    } finally {
      setDeleting(false)
    }
  }

  if (loadError) return <div style={{ ...s.card, padding: 24 }}><p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{loadError}</p></div>
  if (!content) return <div style={{ ...s.card, padding: 24 }}><p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>Cargando...</p></div>

  const operators = category === "Surf" ? content.surf_schools : content.kayaks

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {reviewed && (
        <p style={{ fontSize: 12, color: "var(--muted-strong)", margin: 0, lineHeight: 1.5 }}>
          Lo que sumes pasa por revisión antes de publicarse. Corregir o borrar algo se aplica al instante.
        </p>
      )}
      {editMsg && <p role="status" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, margin: 0 }}>{editMsg}</p>}

      {/* Características del trekking: antes solo se cargaban al crear el lugar. */}
      {category === "Trekking" && (
        <div style={{ ...s.card, padding: 24 }}>
          <p style={sectionTitle}>Características del lugar</p>
          <TrekkingFeaturesForm initial={content.trekking_detail ?? null}
            onSave={saveEdit("put", `/spots/${spotId}/trekking-detail`, "Características")} />
        </div>
      )}

      {activities.includes("Camping") && (
        <div style={{ ...s.card, padding: 24 }}>
          <p style={sectionTitle}>Servicios del camping</p>
          <CampingAmenitiesForm initial={content.amenity_ids ?? []}
            onSave={saveEdit("put", `/spots/${spotId}/camping-amenities`, "Servicios del camping")} />
        </div>
      )}

      {activities.includes("Motorhome") && (
        <div style={{ ...s.card, padding: 24 }}>
          <p style={sectionTitle}>Servicios para motorhomes</p>
          <MotorhomeServicesForm initial={content.motorhome_detail ?? null}
            onSave={saveEdit("put", `/spots/${spotId}/motorhome-detail`, "Servicios para motorhomes")} />
        </div>
      )}

      {/* Experiencias (solo alojamientos) */}
      {showExperiences && (
        <div style={{ ...s.card, padding: 24 }}>
          <p style={sectionTitle}>Experiencias</p>
          {content.experiences.length === 0 && expDrafts.length === 0 && (
            <p style={emptyText}>
              Todavía no hay experiencias. Si tu lugar ofrece actividades como trekking, cabalgatas o pesca, sumalas acá.
            </p>
          )}
          {content.experiences.map(exp => (
            <ItemRow
              key={exp.id}
              title={exp.title}
              detail={[exp.category?.name, exp.price != null ? `$ ${exp.price}` : null].filter(Boolean).join(" · ")}
              pending={!exp.is_approved}
              onEdit={() => setEditing(`exp-${exp.id}`)}
              onDelete={() => askDelete({ url: `/spots/${spotId}/experiences/${exp.id}`, title: exp.title, pending: !exp.is_approved })}
            >
              {editing === `exp-${exp.id}` && (
                <ExperienceEditForm exp={exp} onCancel={() => setEditing(null)}
                  onSave={saveEdit("patch", `/spots/${spotId}/experiences/${exp.id}`, exp.title)} />
              )}
            </ItemRow>
          ))}

          {expDrafts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
              {expDrafts.map((exp, index) => (
                <ExperienceCard key={index} index={index} exp={exp} setExperiences={setExpDrafts} />
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <button type="button" onClick={() => { setExpMsg(null); setExpDrafts(prev => [...prev, defaultExperience()]) }} style={addBtn}>
              ＋ Agregar experiencia
            </button>
            {expDrafts.length > 0 && (
              <button onClick={saveExperiences} disabled={expSaving} style={primaryBtn(expSaving)}>
                {expSaving ? "Guardando..." : "Guardar experiencias"}
              </button>
            )}
            {expMsg && <span style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600 }}>{expMsg}</span>}
            {expError && <span style={{ fontSize: 13, color: "var(--danger)" }}>{expError}</span>}
          </div>
        </div>
      )}

      {/* Unidades de glamping */}
      {showGlamping && (
        <div style={{ ...s.card, padding: 24 }}>
          <p style={sectionTitle}>Tipos de alojamiento</p>
          {content.glamping_units.map((unit, index) => {
            const label = ACCOMMODATION_LABELS[unit.accommodation_type ?? ""] ?? unit.accommodation_type ?? "Alojamiento"
            return (
              <ItemRow
                key={unit.id}
                title={label}
                detail={[
                  unit.capacity != null ? `${unit.capacity} personas` : null,
                  unit.price_per_night != null ? `$ ${unit.price_per_night} por noche` : null,
                ].filter(Boolean).join(" · ")}
                pending={!unit.is_approved}
                onEdit={() => setEditing(`unit-${unit.id}`)}
                onDelete={() => askDelete({ url: `/glamping/glamping/${unit.id}`, title: label, pending: !unit.is_approved })}
              >
                {editing === `unit-${unit.id}` && (
                  <GlampingUnitEditForm unit={unit} index={index} onCancel={() => setEditing(null)}
                    onSave={saveEdit("patch", `/glamping/units/${unit.id}`, label)} />
                )}
              </ItemRow>
            )
          })}

          {unitDrafts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
              {unitDrafts.map((unit, index) => (
                <GlampingUnitCard
                  key={index}
                  index={content.glamping_units.length + index}
                  unit={unit}
                  errors={unitErrors[index] ?? new Set()}
                  onChange={(field, val) => {
                    setUnitDrafts(prev => prev.map((u, i) => (i === index ? { ...u, [field]: val } : u)))
                    setUnitErrors(prev => {
                      const next = new Set(prev[index] ?? [])
                      next.delete(field)
                      return { ...prev, [index]: next }
                    })
                  }}
                  onRemove={() => {
                    setUnitDrafts(prev => prev.filter((_, i) => i !== index))
                    setUnitErrors({})
                  }}
                />
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <button type="button" onClick={() => { setUnitMsg(null); setUnitDrafts(prev => [...prev, defaultGlampingDetail()]) }} style={addBtn}>
              ＋ Agregar tipo de alojamiento
            </button>
            {unitDrafts.length > 0 && (
              <button onClick={saveUnits} disabled={unitSaving} style={primaryBtn(unitSaving)}>
                {unitSaving ? "Guardando..." : "Guardar alojamientos"}
              </button>
            )}
            {unitMsg && <span style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600 }}>{unitMsg}</span>}
            {unitError && <span style={{ fontSize: 13, color: "var(--danger)" }}>{unitError}</span>}
          </div>
        </div>
      )}

      {/* Rutas de trekking: las suma solo el dueño. */}
      {category === "Trekking" && (
        <div style={{ ...s.card, padding: 24 }}>
          <p style={sectionTitle}>Rutas</p>
          {content.routes.length === 0 && <p style={emptyText}>Todavía no hay rutas.</p>}
          {content.routes.map(r => (
            <ItemRow
              key={r.id}
              title={r.name}
              detail={[r.distance_km != null ? `${r.distance_km} km` : null, r.difficulty].filter(Boolean).join(" · ")}
              pending={!r.is_approved}
              onEdit={() => setEditing(`route-${r.id}`)}
              onDelete={() => askDelete({ url: `/routes/${r.id}`, title: r.name, pending: !r.is_approved })}
            >
              {editing === `route-${r.id}` && (
                <RouteEditForm route={r} onCancel={() => setEditing(null)} onSave={saveEdit("patch", `/routes/${r.id}`, r.name)} />
              )}
            </ItemRow>
          ))}
          <div style={{ marginTop: 16 }}>
            <Link href={addToSpotUrl("ruta", spotId)} style={addLink}>＋ Agregar una ruta</Link>
          </div>
        </div>
      )}

      {/* Escalada: también los sectores y vías que sugirió otra gente. */}
      {category === "Escalada" && (
        <div style={{ ...s.card, padding: 24 }}>
          <p style={sectionTitle}>Sectores y vías</p>
          {content.sectors.length === 0 && <p style={emptyText}>Todavía no hay sectores.</p>}
          {content.sectors.map(sector => (
            <div key={sector.id}>
              <ItemRow
                title={sector.name}
                detail={`${sector.routes.length} vía${sector.routes.length !== 1 ? "s" : ""}${sector.type ? ` · ${sector.type}` : ""}`}
                pending={!sector.is_approved}
                onDelete={() => askDelete({
                  url: `/sectors/${sector.id}`, title: sector.name, pending: !sector.is_approved,
                  note: sector.routes.length ? `Se borran también sus ${sector.routes.length} vías. No se puede deshacer.` : undefined,
                })}
              />
              <div style={{ paddingLeft: 18 }}>
                {sector.routes.map(r => (
                  <ItemRow
                    key={r.id}
                    title={r.name}
                    detail={r.grade ?? ""}
                    pending={!r.is_approved}
                    onDelete={() => askDelete({ url: `/climbingroutes/${r.id}`, title: r.name, pending: !r.is_approved })}
                  />
                ))}
                {/* Un sector en revisión solo lo amplía quien lo sugirió. */}
                {sector.is_approved && (
                  <div style={{ padding: "8px 0 4px" }}>
                    <Link href={addToSpotUrl("via", spotId, sector.id)} style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}>
                      ＋ Agregar una vía a {sector.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <Link href={addToSpotUrl("sector", spotId)} style={addLink}>＋ Agregar un sector</Link>
          </div>
        </div>
      )}

      {/* Surf y kayak */}
      {(category === "Surf" || category === "Kayak") && (
        <div style={{ ...s.card, padding: 24 }}>
          <p style={sectionTitle}>{category === "Surf" ? "Escuelas de surf" : "Servicios de kayak"}</p>
          {operators.length === 0 && (
            <p style={emptyText}>Todavía no hay {category === "Surf" ? "escuelas" : "servicios"}.</p>
          )}
          {operators.map(op => (
            <ItemRow
              key={op.id}
              title={op.name}
              detail=""
              pending={!op.is_approved}
              onDelete={() => askDelete({
                url: category === "Surf" ? `/surfschool/${op.id}` : `/kayak/${op.id}`,
                title: op.name, pending: !op.is_approved,
                note: "Se borra con sus fotos. No se puede deshacer.",
              })}
            />
          ))}
          <div style={{ marginTop: 16 }}>
            <Link href={addToSpotUrl(category === "Surf" ? "surf" : "kayak", spotId)} style={addLink}>
              {category === "Surf" ? "＋ Agregar una escuela" : "＋ Agregar un servicio de kayak"}
            </Link>
          </div>
        </div>
      )}

      <ConfirmModal
        open={toDelete !== null}
        title={`¿Eliminar "${toDelete?.title ?? ""}"?`}
        message={toDelete?.pending
          ? "Todavía está en revisión: se retira y no se publica."
          : toDelete?.note ?? "Deja de verse en tu lugar. No se puede deshacer."}
        loading={deleting}
        error={deleteError}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

// Fila de lista, como las de "Tus lugares" en /profile. Con onEdit, "Editar"
// abre abajo el formulario (children).
function ItemRow({ title, detail, pending, onDelete, onEdit, children }: {
  title: string; detail: string; pending: boolean; onDelete: () => void; onEdit?: () => void; children?: React.ReactNode
}) {
  return (
    <div style={{ borderBottom: "1px solid #ede9e1" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>{title}</span>
            {pending && <Pill variant="yellow" size="sm">En revisión</Pill>}
          </div>
          {detail && <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>{detail}</p>}
        </div>
        {onEdit && !children && (
          <button onClick={onEdit} aria-label={`Editar ${title}`} style={{ ...deleteBtn, color: "var(--primary)", border: "1px solid var(--border)" }}>Editar</button>
        )}
        <button onClick={onDelete} aria-label={`Eliminar ${title}`} style={deleteBtn}>✕</button>
      </div>
      {children}
    </div>
  )
}
