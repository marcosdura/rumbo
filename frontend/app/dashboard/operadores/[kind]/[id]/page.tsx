"use client"

// Dashboard de una escuela de surf o un servicio de kayak, para su dueño.
// Mismo funcionamiento que el dashboard de un spot: nombre y fotos nuevas
// pasan por revisión (si ya está publicado), el resto se aplica al instante;
// un solo Guardar, con aviso previo y la pantalla de carga mientras sube.
import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import Pill from "@/components/ui/Pill"
import ConfirmModal from "@/components/ui/ConfirmModal"
import SubmittingOverlay from "@/components/ui/SubmittingOverlay"
import { api } from "@/lib/api"
import { uploadImageToCloudinary, buildPublicId, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/uploadImage"
import ChangeRequestBanner from "@/app/dashboard/spots/[id]/ChangeRequestBanner"
import { s, MONTHS } from "@/app/dashboard/spots/[id]/styles"
import { errorMessage } from "@/app/dashboard/spots/[id]/changes"
import {
  OPERATOR_KINDS, OPERATOR_LABELS, asSpotChangeRequest, describeOperatorFields, formFromOperator,
  operatorPayload, photosOf, type Operator, type OperatorForm, type OperatorKind,
} from "./operator"

const MAX_OPERATOR_PHOTOS = 3
type EditResult = { applied: string[]; pending: string[] }
type Staged = { file: File; url: string }

export default function OperatorDashboardPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const kind = params.kind as OperatorKind
  const operatorId = params.id as string
  const token = session?.id_token

  const [op, setOp] = useState<Operator | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [form, setForm] = useState<OperatorForm | null>(null)
  // Fotos: las que quedan de las publicadas + las nuevas elegidas (se suben
  // al guardar, como en el dashboard del spot).
  const [kept, setKept] = useState<string[]>([])
  const [staged, setStaged] = useState<Staged[]>([])
  const [photoError, setPhotoError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [preview, setPreview] = useState<EditResult | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [dismissing, setDismissing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const base = `/operators/${kind}/${operatorId}`

  useEffect(() => {
    if (status === "loading") return
    if (!session) router.push("/")
  }, [session, status])

  async function load() {
    try {
      const { data } = await api.get<Operator>(base, { token })
      setOp(data)
      setForm(formFromOperator(data))
      setKept(photosOf(data))
      setLoadError(null)
    } catch {
      setLoadError("No encontramos esta escuela, o no es tuya.")
    }
  }

  useEffect(() => {
    if (!token) return
    if (!OPERATOR_KINDS.includes(kind)) { setLoadError("No encontramos esta escuela, o no es tuya."); return }
    load()
  }, [token, kind, operatorId])

  function upd<K extends keyof OperatorForm>(field: K, value: OperatorForm[K]) {
    setForm(prev => (prev ? { ...prev, [field]: value } : prev))
  }

  function addFiles(files: File[]) {
    const valid = files.filter(f => ALLOWED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_IMAGE_BYTES)
    const total = kept.length + staged.length + valid.length
    if (total > MAX_OPERATOR_PHOTOS) {
      setPhotoError(`El límite es ${MAX_OPERATOR_PHOTOS} fotos. Sacá alguna para poder sumar otra.`)
      return
    }
    setStaged(prev => [...prev, ...valid.map(file => ({ file, url: URL.createObjectURL(file) }))])
    setPhotoError(valid.length < files.length ? "Algún archivo no se pudo agregar: solo imágenes de hasta 15MB." : null)
  }

  function showOk(message: string) {
    setSaveOk(message)
    setTimeout(() => setSaveOk(null), 4000)
  }

  // Paso 1: preguntar qué pasaría (dry_run), sin subir nada.
  async function handleSave() {
    if (!op || !form) return
    setSaving(true); setSaveOk(null); setSaveError(null)
    try {
      // URLs de mentira con el formato real: al dry_run solo le importa que
      // haya fotos nuevas, todavía no se subió ninguna.
      const placeholders = staged.map(() => `https://res.cloudinary.com/x/image/upload/${buildPublicId(op.spot.id)}.jpg`)
      const { data } = await api.patch<EditResult>(base, operatorPayload(kind, form, [...kept, ...placeholders]), { token, params: { dry_run: true } })
      if (data.pending.length === 0 && data.applied.length === 0) showOk("No había cambios para guardar.")
      else if (data.pending.length > 0) setPreview(data)
      else await commitSave()
    } catch (e) {
      setSaveError(errorMessage(e, "No se pudo guardar. Intentá de nuevo."))
    } finally {
      setSaving(false)
    }
  }

  // Paso 2: subir las fotos nuevas y guardar de verdad.
  async function commitSave() {
    if (!op || !form) return
    setPreview(null); setSubmitting(true)
    const uploaded: string[] = []
    try {
      for (let i = 0; i < staged.length; i++) {
        setUploadProgress(`Subiendo foto ${i + 1} de ${staged.length}...`)
        const { url } = await uploadImageToCloudinary(staged[i].file, { spotId: op.spot.id })
        uploaded.push(url)
      }
      setUploadProgress("Guardando cambios...")
      const { data } = await api.patch<EditResult>(base, operatorPayload(kind, form, [...kept, ...uploaded]), { token })
      staged.forEach(p => URL.revokeObjectURL(p.url))
      setStaged([])
      await load()
      showOk(data.pending.length ? `✓ Guardado. En revisión: ${describeOperatorFields(data.pending)}.` : "✓ Guardado correctamente")
    } catch (e) {
      if (uploaded.length) {
        api.post(`${base}/discard-photos`, { public_ids: uploaded }, { token }).catch(() => {})
      }
      setSaveError(errorMessage(e, "No se pudo guardar. Intentá de nuevo."))
    } finally {
      setSubmitting(false); setUploadProgress(null)
    }
  }

  async function handleCancelRequest() {
    setCancelLoading(true); setCancelError(null)
    try {
      await api.post(`${base}/change-request/cancel`, undefined, { token })
      await load()
      setCancelOpen(false)
    } catch (e) {
      setCancelError(errorMessage(e, "No se pudo cancelar el cambio. Intentá de nuevo."))
    } finally {
      setCancelLoading(false)
    }
  }

  async function handleDismiss() {
    setDismissing(true)
    try {
      await api.post(`${base}/change-request/dismiss`, undefined, { token })
      setOp(prev => (prev ? { ...prev, change_request: null } : prev))
    } catch {
      // Si falla, el aviso sigue ahí y se puede volver a cerrar.
    } finally {
      setDismissing(false)
    }
  }

  const page = { minHeight: "100vh", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }

  if (loadError) {
    return (
      <div style={page}>
        <Navbar />
        <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 24px" }}>
          <p style={{ color: "var(--danger)", fontSize: 14 }}>{loadError}</p>
          <Link href="/profile" style={{ fontSize: 13, color: "var(--muted)" }}>← Volver al perfil</Link>
        </div>
      </div>
    )
  }
  if (!op || !form) {
    return (
      <div style={page}>
        <Navbar />
        <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 24px" }}>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</p>
        </div>
      </div>
    )
  }

  const pendingChange = op.change_request?.status === "pending" ? op.change_request : null
  const lockSensitive = pendingChange !== null
  const photoCount = kept.length + staged.length
  const sectionTitle = { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--primary)", margin: "0 0 12px" }
  const select = (value: string, onChange: (v: string) => void, options: [string, string][]) => (
    <select value={value} onChange={e => onChange(e.target.value)} style={s.input}>
      <option value="">-</option>
      {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
    </select>
  )
  const yesNo = (value: boolean | null, onChange: (v: boolean) => void) => (
    <div style={{ display: "flex", gap: 8 }}>
      {([[true, "Sí"], [false, "No"]] as [boolean, string][]).map(([v, label]) => (
        <button key={label} type="button" onClick={() => onChange(v)} style={s.pill(value === v)}>{label}</button>
      ))}
    </div>
  )

  return (
    <div style={page}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 60px" }}>

        {/* Header, como el del dashboard del spot */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/profile" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
            ← Volver al perfil
          </Link>
          <h1 style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 26, fontWeight: 600, color: "#1b1b19", margin: "0 0 6px" }}>
            {op.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Pill variant={op.is_approved ? "green" : "yellow"} size="sm">
              {op.is_approved ? "✓ Publicada" : "⏳ En revisión"}
            </Pill>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              {OPERATOR_LABELS[kind]} en{" "}
              {op.spot.slug && op.spot.is_approved
                ? <Link href={`/spots/${op.spot.slug}`} style={{ color: "var(--primary)", textDecoration: "none" }}>{op.spot.name}</Link>
                : op.spot.name}
            </span>
          </div>
        </div>

        {op.change_request && (
          <ChangeRequestBanner
            request={asSpotChangeRequest(op.change_request)}
            onCancel={() => { setCancelError(null); setCancelOpen(true) }}
            onDismiss={handleDismiss}
            dismissing={dismissing}
          />
        )}

        <div style={{ ...s.card, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {op.is_approved && !lockSensitive && (
            <p style={{ fontSize: 12, color: "var(--muted-strong)", margin: 0, lineHeight: 1.5 }}>
              Los cambios de nombre y las fotos nuevas pasan por revisión antes de publicarse. El resto se actualiza al instante.
            </p>
          )}
          <div>
            <label style={s.label}>Nombre</label>
            <input value={form.name} onChange={e => upd("name", e.target.value)} disabled={lockSensitive}
              style={{ ...s.input, ...(lockSensitive ? { opacity: 0.6, cursor: "not-allowed" } : {}) }} />
            {pendingChange?.changes.name && (
              <p style={{ fontSize: 12, color: "#78590a", margin: "6px 0 0" }}>⏳ En revisión: «{pendingChange.changes.name.to}»</p>
            )}
          </div>

          <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={sectionTitle}>{kind === "surf_school" ? "Clases" : "Servicio"}</p>
            {kind === "surf_school" ? (
              <>
                <div><label style={s.label}>Tipo de clase</label>{select(form.class_type, v => upd("class_type", v), [["grupal", "Grupal"], ["privada", "Privada"], ["intensivo", "Intensivo"]])}</div>
                <div><label style={s.label}>¿Incluye el equipo?</label>{yesNo(form.equipment_include, v => upd("equipment_include", v))}</div>
              </>
            ) : (
              <>
                <div><label style={s.label}>Tipo de agua</label>{select(form.water_type, v => upd("water_type", v), [["rio", "Río"], ["lago", "Lago"], ["mar", "Mar"]])}</div>
                <div><label style={s.label}>Dificultad</label>{select(form.difficulty, v => upd("difficulty", v), [["facil", "Fácil"], ["intermedio", "Intermedio"], ["dificil", "Difícil"]])}</div>
                <div><label style={s.label}>Tipo de kayak</label>{select(form.kayak_type, v => upd("kayak_type", v), [["travesia", "Travesía"], ["recreativo", "Recreativo"], ["rapido", "Rápido"]])}</div>
                <div><label style={s.label}>¿Alquilás kayaks?</label>{yesNo(form.rental_available, v => upd("rental_available", v))}</div>
              </>
            )}
            <div>
              <label style={s.label}>Duración (horas)</label>
              <input value={form.duration} onChange={e => upd("duration", e.target.value)} type="number" min={0} step="0.5" style={s.input} />
            </div>
          </div>

          <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={sectionTitle}>Contacto</p>
            <div><label style={s.label}>Email</label><input value={form.email} onChange={e => upd("email", e.target.value)} type="email" style={s.input} /></div>
            <div><label style={s.label}>WhatsApp</label><input value={form.whatsapp} onChange={e => upd("whatsapp", e.target.value)} style={s.input} /></div>
            <div><label style={s.label}>Instagram</label><input value={form.instagram} onChange={e => upd("instagram", e.target.value)} style={s.input} /></div>
          </div>

          <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 16 }}>
            <p style={sectionTitle}>Temporada</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button type="button" onClick={() => upd("seasonal", false)} style={s.pill(!form.seasonal)}>🗓️ Todo el año</button>
              <button type="button" onClick={() => upd("seasonal", true)} style={s.pill(form.seasonal)}>📅 Temporada específica</button>
            </div>
            {form.seasonal && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["season_start", "season_end"] as const).map((field, i) => (
                  <div key={field}>
                    <label style={s.label}>{i === 0 ? "Desde" : "Hasta"}</label>
                    <select value={form[field]} onChange={e => upd(field, e.target.value)} style={s.input}>
                      <option value="">Mes...</option>
                      {MONTHS.map((m, j) => <option key={j + 1} value={String(j + 1)}>{m}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 16 }}>
            <p style={sectionTitle}>Fotos ({photoCount}/{MAX_OPERATOR_PHOTOS})</p>
            <div className="photo-grid" style={{ marginTop: 0 }}>
              {kept.map(url => (
                <div key={url} className="photo-card">
                  <img src={url} alt="" />
                  <div style={{ padding: "8px 8px 6px", display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={() => setKept(prev => prev.filter(u => u !== url))} aria-label="Quitar foto"
                      style={{ padding: "4px 8px", borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "var(--danger)", border: "1px solid #fecaca" }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {(pendingChange?.changes.photos?.to ?? []).filter(u => !kept.includes(u)).map(url => (
                <div key={url} className="photo-card">
                  <img src={url} alt="" style={{ opacity: 0.7 }} />
                  <div style={{ position: "absolute", top: 6, left: 6, background: "#fef9e7", color: "#78590a", border: "1px solid #f0d98a", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 6 }}>En revisión</div>
                </div>
              ))}
              {staged.map((p, i) => (
                <div key={p.url} className="photo-card">
                  <img src={p.url} alt="" />
                  <div style={{ position: "absolute", top: 6, left: 6, background: "#fef9e7", color: "#78590a", border: "1px solid #f0d98a", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 6 }}>Sin guardar</div>
                  <button type="button" aria-label="Quitar foto nueva"
                    onClick={() => { URL.revokeObjectURL(p.url); setStaged(prev => prev.filter((_, j) => j !== i)) }}
                    style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", lineHeight: 1 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <button type="button" disabled={lockSensitive || photoCount >= MAX_OPERATOR_PHOTOS}
                onClick={() => { setPhotoError(null); fileRef.current?.click() }}
                style={{ padding: "7px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", border: "none",
                  cursor: lockSensitive || photoCount >= MAX_OPERATOR_PHOTOS ? "not-allowed" : "pointer",
                  background: lockSensitive || photoCount >= MAX_OPERATOR_PHOTOS ? "#f0ede8" : "var(--primary)",
                  color: lockSensitive || photoCount >= MAX_OPERATOR_PHOTOS ? "#b0ac9e" : "#fff" }}>
                {lockSensitive ? "Cambio en revisión" : photoCount >= MAX_OPERATOR_PHOTOS ? "Límite alcanzado" : "+ Agregar fotos"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                onChange={e => { addFiles(Array.from(e.target.files ?? [])); e.target.value = "" }} />
            </div>
            {photoError && <p style={{ fontSize: 13, color: "var(--danger)", margin: "8px 0 0" }}>{photoError}</p>}
          </div>
        </div>

        {/* Guardar, igual que en el dashboard del spot */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <button onClick={handleSave} disabled={saving || submitting}
            style={{ padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "var(--primary)", color: "#fff", border: "none", opacity: saving || submitting ? 0.7 : 1 }}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          {saveOk && <span style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600 }}>{saveOk}</span>}
          {saveError && <span style={{ fontSize: 13, color: "var(--danger)" }}>{saveError}</span>}
        </div>
      </div>

      <ConfirmModal
        open={preview !== null}
        title="Algunos cambios pasan a revisión"
        confirmLabel="Guardar cambios"
        cancelLabel="Volver"
        confirmVariant="primary"
        onCancel={() => setPreview(null)}
        onConfirm={commitSave}
      >
        {preview && (
          <div style={{ fontSize: 14, color: "#4a4a46", lineHeight: 1.6 }}>
            <p style={{ margin: 0 }}>
              ⏳ <strong>Pasan a revisión:</strong> {describeOperatorFields(preview.pending)}. El público sigue viendo la versión actual hasta que se aprueben.
            </p>
            {preview.applied.length > 0 && (
              <p style={{ margin: "10px 0 0" }}>✓ <strong>Se actualizan al instante:</strong> {describeOperatorFields(preview.applied)}.</p>
            )}
          </div>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={cancelOpen}
        title="¿Cancelar el cambio en revisión?"
        message="Se descarta el pedido y se borran las fotos nuevas que subiste. No se puede deshacer."
        confirmLabel="Cancelar cambio"
        cancelLabel="Volver"
        loading={cancelLoading}
        loadingLabel="Cancelando..."
        error={cancelError}
        onCancel={() => setCancelOpen(false)}
        onConfirm={handleCancelRequest}
      />

      {submitting && <SubmittingOverlay title="Guardando tus cambios..." uploadProgress={uploadProgress} />}
    </div>
  )
}
