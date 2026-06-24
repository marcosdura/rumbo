"use client"

import { useRef, useState } from "react"
import type React from "react"
import { s, errorInputBorder, errorHintText } from "../styles"
import Field from "../ui/Field"
import Toggle from "../ui/Toggle"
import SeasonToggle from "../ui/SeasonToggle"
import NavRow from "../ui/NavRow"
import type { KayakItem } from "../types"

export default function StepKayak({
  kayaks, setKayaks, kayakPhotoFiles, setKayakPhotoFiles, kayakPhotoPreviews, setKayakPhotoPreviews,
  error, onBack, onNext, optional, onSkip,
}: {
  kayaks: KayakItem[]
  setKayaks: React.Dispatch<React.SetStateAction<KayakItem[]>>
  kayakPhotoFiles: (File | null)[]
  setKayakPhotoFiles: React.Dispatch<React.SetStateAction<(File | null)[]>>
  kayakPhotoPreviews: (string | null)[]
  setKayakPhotoPreviews: React.Dispatch<React.SetStateAction<(string | null)[]>>
  error: string | null
  onBack: () => void
  onNext: () => void
  optional?: boolean
  onSkip?: () => void
}) {
  const ref1 = useRef<HTMLInputElement>(null)
  const ref2 = useRef<HTMLInputElement>(null)
  const ref3 = useRef<HTMLInputElement>(null)
  const refs = [ref1, ref2, ref3]
  const [nameErrors, setNameErrors] = useState<Set<number>>(new Set())
  const [photoError, setPhotoError] = useState(false)

  function updKayak(i: number, field: string, val: string | boolean) {
    setKayaks(prev => prev.map((k, idx) => idx === i ? { ...k, [field]: val } : k))
    if (field === "name" && val) setNameErrors(prev => { const n = new Set(prev); n.delete(i); return n })
  }
  function updKayakSeason(i: number, t: "all_year" | "seasonal") {
    setKayaks(prev => prev.map((k, idx) => idx === i ? { ...k, season_type: t } : k))
  }
  function handleKayakPhoto(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setKayakPhotoFiles(prev => { const n = [...prev]; n[index] = file; return n })
    setKayakPhotoPreviews(prev => { const n = [...prev]; n[index] = file ? URL.createObjectURL(file) : null; return n })
    if (index === 0 && file) setPhotoError(false)
  }

  function validate(): boolean {
    const missing = new Set<number>()
    kayaks.forEach((k, i) => { if (!k.name.trim()) missing.add(i) })
    const missingPhoto = !kayakPhotoFiles[0]
    setNameErrors(missing)
    setPhotoError(missingPhoto)
    return missing.size === 0 && !missingPhoto
  }

  function handleNext() {
    if (!validate()) return
    onNext()
  }

  return (
    <div>
      <h2 style={s.title}>Datos de Kayak</h2>
      {kayaks.map((k, i) => (
        <div key={i} style={s.card}>
          <p style={s.cardTitle}>Servicio {i + 1}</p>
          <div style={s.form}>
            <Field label="Nombre" required={true} hasError={nameErrors.has(i)} errorText="El nombre es obligatorio">
              <input
                style={{ ...s.input, ...(nameErrors.has(i) ? errorInputBorder : {}) }}
                value={k.name} onChange={e => updKayak(i, "name", e.target.value)}
              />
            </Field>
            <div className="form-two-col">
              <Field label="Tipo de agua" required={false}>
                <select style={s.input} value={k.water_type} onChange={e => updKayak(i, "water_type", e.target.value)}>
                  <option value="">-</option>
                  <option value="rio">Río</option>
                  <option value="lago">Lago</option>
                  <option value="mar">Mar</option>
                </select>
              </Field>
              <Field label="Dificultad" required={false}>
                <select style={s.input} value={k.difficulty} onChange={e => updKayak(i, "difficulty", e.target.value)}>
                  <option value="">-</option>
                  <option value="facil">Fácil</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="dificil">Difícil</option>
                </select>
              </Field>
            </div>
            <div className="form-two-col">
              <Field label="Duración (horas)" required={false}>
                <input style={s.input} type="number" step="any" value={k.duration} onChange={e => updKayak(i, "duration", e.target.value)} />
              </Field>
              <Field label="Tipo de kayak" required={false}>
                <select style={s.input} value={k.kayak_type} onChange={e => updKayak(i, "kayak_type", e.target.value)}>
                  <option value="">-</option>
                  <option value="travesia">Travesía</option>
                  <option value="recreativo">Recreativo</option>
                  <option value="rapido">Rápido</option>
                </select>
              </Field>
            </div>
            <SeasonToggle
              type={k.season_type}
              onTypeChange={t => updKayakSeason(i, t)}
              start={k.season_start} onStartChange={v => updKayak(i, "season_start", v)}
              end={k.season_end}     onEndChange={v => updKayak(i, "season_end", v)}
            />
            <div className="form-two-col">
              <Field label="Email" required={false}><input style={s.input} type="email" value={k.email} onChange={e => updKayak(i, "email", e.target.value)} /></Field>
              <Field label="WhatsApp" required={false}><input style={s.input} type="text" placeholder="Ej: 099123456" value={k.whatsapp} onChange={e => updKayak(i, "whatsapp", e.target.value)} /></Field>
            </div>
            <div className="form-two-col">
              <Field label="Instagram" required={false}><input style={s.input} type="text" placeholder="@usuario" value={k.instagram} onChange={e => updKayak(i, "instagram", e.target.value)} /></Field>
              <div />
            </div>
            <Toggle label="Alquiler disponible" checked={k.rental_available} onChange={v => updKayak(i, "rental_available", v)} />

            {i === 0 && (
              <div style={{ borderTop: "1px solid #e0ddd6", paddingTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: photoError ? "#e53e3e" : "#1b1b19", margin: "0 0 4px" }}>Fotos del servicio</p>
                <p style={{ fontSize: 12, color: "#9a9690", margin: "0 0 14px" }}>La foto de portada es obligatoria</p>
                {photoError && <p style={errorHintText}>Subí la foto de portada para continuar</p>}
                {([
                  { label: "Foto de portada",  req: true,  idx: 0 },
                  { label: "Foto adicional 2", req: false, idx: 1 },
                  { label: "Foto adicional 3", req: false, idx: 2 },
                ]).map(({ label, req, idx }) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <input ref={refs[idx]} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleKayakPhoto(idx, e)} />
                    {kayakPhotoPreviews[idx] ? (
                      <div style={{ position: "relative", width: 88, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                        <img src={kayakPhotoPreviews[idx]!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        <button
                          type="button"
                          onClick={() => {
                            setKayakPhotoFiles(prev => { const n = [...prev]; n[idx] = null; return n })
                            setKayakPhotoPreviews(prev => { const n = [...prev]; n[idx] = null; return n })
                            if (refs[idx].current) refs[idx].current!.value = ""
                          }}
                          style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", lineHeight: 1 }}
                        >×</button>
                      </div>
                    ) : (
                      <div
                        onClick={() => refs[idx].current?.click()}
                        style={{ width: 88, height: 64, borderRadius: 10, border: "2px dashed #e0ddd6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#f7f5f0", flexShrink: 0 }}
                      >
                        <span style={{ fontSize: 22, color: "#c8c4bc" }}>+</span>
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#1b1b19", margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 12, color: req ? "#e53e3e" : "#9a9690", margin: "2px 0 0" }}>{req ? "(obligatoria)" : "(opcional)"}</p>
                      {!kayakPhotoPreviews[idx] && (
                        <button type="button" onClick={() => refs[idx].current?.click()} style={{ ...s.btnAdd, marginTop: 6, padding: "4px 12px", fontSize: 12 }}>
                          Seleccionar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      {optional && onSkip && (
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <button
            type="button"
            onClick={onSkip}
            style={{ background: "none", border: "none", color: "#9a9690", fontSize: 13, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", padding: 0 }}
          >
            Saltar este paso
          </button>
        </div>
      )}
      <NavRow onBack={onBack} onNext={handleNext} error={error ?? ((nameErrors.size > 0 || photoError) ? "Completá los campos marcados en rojo." : null)} />
    </div>
  )
}
