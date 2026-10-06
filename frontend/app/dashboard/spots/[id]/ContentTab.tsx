"use client"

import { useEffect, useState } from "react"
import Pill from "@/components/ui/Pill"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { api } from "@/lib/api"
import { ExperienceCard } from "@/components/agregar-lugar/steps/StepExperiencias"
import { GlampingUnitCard } from "@/components/agregar-lugar/steps/StepGlampingUnidades"
import { defaultExperience, defaultGlampingDetail } from "@/components/agregar-lugar/constants"
import { experiencePayload, glampingUnitPayload, missingGlampingFields } from "@/components/agregar-lugar/payloads"
import type { ExperienceItem, GlampingDetailItem } from "@/components/agregar-lugar/types"
import { s } from "./styles"
import { errorMessage } from "./changes"
import type { OwnerContent, OwnedExperience, OwnedGlampingUnit } from "./types"

interface Props {
  spotId: number
  token: string | undefined
  // El spot ya está aprobado: lo nuevo pasa por revisión.
  reviewed: boolean
  showGlamping: boolean
}

const ACCOMMODATION_LABELS: Record<string, string> = {
  domo: "Domo", carpa: "Carpa equipada", cabaña: "Cabaña", treehouse: "Treehouse", otro: "Otro",
}

// Mismo encabezado de sección que InfoTab.
const sectionTitle = { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--primary)", margin: "0 0 12px" }
// Mismo botón primario que "Guardar cambios".
const primaryBtn = (busy: boolean) => ({ padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "var(--primary)", color: "#fff", border: "none", opacity: busy ? 0.7 : 1 })
// Mismo ✕ que borrar una foto.
const deleteBtn = { padding: "4px 8px", borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "var(--danger)", border: "1px solid #fecaca", flexShrink: 0 }
const addBtn = { padding: "7px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#f7f5f0", color: "#3d3d3a", border: "1px solid var(--border)" }

export function savedMessage(created: { is_approved?: boolean }[]) {
  return created.some(c => c.is_approved === false)
    ? "✓ Guardado. Queda en revisión hasta que el equipo de Rumbo lo apruebe."
    : "✓ Guardado correctamente"
}

type ToDelete = { kind: "experience"; item: OwnedExperience } | { kind: "glamping"; item: OwnedGlampingUnit }

export default function ContentTab({ spotId, token, reviewed, showGlamping }: Props) {
  const [content, setContent] = useState<OwnerContent | null>(null)
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

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      if (toDelete.kind === "experience") {
        await api.del(`/spots/${spotId}/experiences/${toDelete.item.id}`, { token })
      } else {
        await api.del(`/glamping/glamping/${toDelete.item.id}`, { token })
      }
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {reviewed && (
        <p style={{ fontSize: 12, color: "var(--muted-strong)", margin: 0, lineHeight: 1.5 }}>
          Lo que sumes acá pasa por revisión antes de publicarse. Borrar algo se aplica al instante.
        </p>
      )}

      {/* Experiencias */}
      <div style={{ ...s.card, padding: 24 }}>
        <p style={sectionTitle}>Experiencias</p>
        {content.experiences.length === 0 && expDrafts.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>
            Todavía no hay experiencias. Si tu lugar ofrece actividades como trekking, cabalgatas o pesca, sumalas acá.
          </p>
        )}
        {content.experiences.map(exp => (
          <ItemRow
            key={exp.id}
            title={exp.title}
            detail={[exp.category?.name, exp.price != null ? `$ ${exp.price}` : null].filter(Boolean).join(" · ")}
            pending={!exp.is_approved}
            onDelete={() => { setDeleteError(null); setToDelete({ kind: "experience", item: exp }) }}
          />
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

      {/* Unidades de glamping */}
      {showGlamping && (
        <div style={{ ...s.card, padding: 24 }}>
          <p style={sectionTitle}>Tipos de alojamiento</p>
          {content.glamping_units.map(unit => (
            <ItemRow
              key={unit.id}
              title={ACCOMMODATION_LABELS[unit.accommodation_type ?? ""] ?? unit.accommodation_type ?? "Alojamiento"}
              detail={[
                unit.capacity != null ? `${unit.capacity} personas` : null,
                unit.price_per_night != null ? `$ ${unit.price_per_night} por noche` : null,
              ].filter(Boolean).join(" · ")}
              pending={!unit.is_approved}
              onDelete={() => { setDeleteError(null); setToDelete({ kind: "glamping", item: unit }) }}
            />
          ))}

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

      <ConfirmModal
        open={toDelete !== null}
        title={toDelete?.kind === "glamping" ? "¿Eliminar este alojamiento?" : "¿Eliminar esta experiencia?"}
        message={toDelete && ("is_approved" in toDelete.item) && !toDelete.item.is_approved
          ? "Todavía está en revisión: se retira y no se publica."
          : "Deja de verse en tu lugar. No se puede deshacer."}
        loading={deleting}
        error={deleteError}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

// Fila de lista, como las de "Tus lugares" en /profile.
function ItemRow({ title, detail, pending, onDelete }: { title: string; detail: string; pending: boolean; onDelete: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #ede9e1" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>{title}</span>
          {pending && <Pill variant="yellow" size="sm">En revisión</Pill>}
        </div>
        {detail && <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>{detail}</p>}
      </div>
      <button onClick={onDelete} aria-label={`Eliminar ${title}`} style={deleteBtn}>✕</button>
    </div>
  )
}
