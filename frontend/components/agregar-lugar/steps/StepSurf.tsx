"use client"

import { useRef } from "react"
import type React from "react"
import { s } from "../styles"
import Field from "../ui/Field"
import Toggle from "../ui/Toggle"
import SeasonToggle from "../ui/SeasonToggle"
import NavRow from "../ui/NavRow"
import type { SurfItem } from "../types"

export default function StepSurf({
  surf, setSurf, surfPhotoFiles, setSurfPhotoFiles, surfPhotoPreviews, setSurfPhotoPreviews,
  error, onBack, onNext,
}: {
  surf: SurfItem
  setSurf: React.Dispatch<React.SetStateAction<SurfItem>>
  surfPhotoFiles: (File | null)[]
  setSurfPhotoFiles: React.Dispatch<React.SetStateAction<(File | null)[]>>
  surfPhotoPreviews: (string | null)[]
  setSurfPhotoPreviews: React.Dispatch<React.SetStateAction<(string | null)[]>>
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  const ref1 = useRef<HTMLInputElement>(null)
  const ref2 = useRef<HTMLInputElement>(null)
  const ref3 = useRef<HTMLInputElement>(null)
  const refs = [ref1, ref2, ref3]

  function handleSurfPhoto(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSurfPhotoFiles(prev => { const n = [...prev]; n[index] = file; return n })
    setSurfPhotoPreviews(prev => { const n = [...prev]; n[index] = file ? URL.createObjectURL(file) : null; return n })
  }

  return (
    <div>
      <h2 style={s.title}>Datos de Surf</h2>
      <div style={s.card}>
        <div style={s.form}>
          <Field label="Nombre de la escuela" required={true}>
            <input style={s.input} value={surf.name} onChange={e => setSurf(p => ({ ...p, name: e.target.value }))} />
          </Field>
          <div className="form-two-col">
            <Field label="Tipo de clase" required={false}>
              <select style={s.input} value={surf.class_type} onChange={e => setSurf(p => ({ ...p, class_type: e.target.value }))}>
                <option value="">-</option>
                <option value="grupal">Grupal</option>
                <option value="privada">Privada</option>
                <option value="intensivo">Intensivo</option>
              </select>
            </Field>
            <Field label="Duración (horas)" required={false}>
              <input style={s.input} type="number" step="any" value={surf.duration} onChange={e => setSurf(p => ({ ...p, duration: e.target.value }))} />
            </Field>
          </div>
          <SeasonToggle
            type={surf.season_type}
            onTypeChange={t => setSurf(p => ({ ...p, season_type: t }))}
            start={surf.season_start} onStartChange={v => setSurf(p => ({ ...p, season_start: v }))}
            end={surf.season_end}   onEndChange={v => setSurf(p => ({ ...p, season_end: v }))}
          />
          <div className="form-two-col">
            <Field label="Email" required={false}><input style={s.input} type="email" value={surf.email} onChange={e => setSurf(p => ({ ...p, email: e.target.value }))} /></Field>
            <Field label="WhatsApp" required={false}><input style={s.input} type="text" placeholder="Ej: 099123456" value={surf.whatsapp} onChange={e => setSurf(p => ({ ...p, whatsapp: e.target.value }))} /></Field>
          </div>
          <div className="form-two-col">
            <Field label="Instagram" required={false}><input style={s.input} type="text" placeholder="@usuario" value={surf.instagram} onChange={e => setSurf(p => ({ ...p, instagram: e.target.value }))} /></Field>
            <div />
          </div>
          <Toggle label="Equipo incluido" checked={surf.equipment_include} onChange={v => setSurf(p => ({ ...p, equipment_include: v }))} />

          <div style={{ borderTop: "1px solid #e0ddd6", paddingTop: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19", margin: "0 0 4px" }}>Fotos de la escuela</p>
            <p style={{ fontSize: 12, color: "#9a9690", margin: "0 0 14px" }}>La foto de portada es obligatoria</p>
            {([
              { label: "Foto de portada",  req: true,  i: 0 },
              { label: "Foto adicional 2", req: false, i: 1 },
              { label: "Foto adicional 3", req: false, i: 2 },
            ]).map(({ label, req, i }) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <input ref={refs[i]} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleSurfPhoto(i, e)} />
                {surfPhotoPreviews[i] ? (
                  <div style={{ position: "relative", width: 88, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                    <img src={surfPhotoPreviews[i]!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button
                      type="button"
                      onClick={() => {
                        setSurfPhotoFiles(prev => { const n = [...prev]; n[i] = null; return n })
                        setSurfPhotoPreviews(prev => { const n = [...prev]; n[i] = null; return n })
                        if (refs[i].current) refs[i].current!.value = ""
                      }}
                      style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", lineHeight: 1 }}
                    >×</button>
                  </div>
                ) : (
                  <div
                    onClick={() => refs[i].current?.click()}
                    style={{ width: 88, height: 64, borderRadius: 10, border: "2px dashed #e0ddd6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#f7f5f0", flexShrink: 0 }}
                  >
                    <span style={{ fontSize: 22, color: "#c8c4bc" }}>+</span>
                  </div>
                )}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#1b1b19", margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 12, color: req ? "#e53e3e" : "#9a9690", margin: "2px 0 0" }}>{req ? "(obligatoria)" : "(opcional)"}</p>
                  {!surfPhotoPreviews[i] && (
                    <button type="button" onClick={() => refs[i].current?.click()} style={{ ...s.btnAdd, marginTop: 6, padding: "4px 12px", fontSize: 12 }}>
                      Seleccionar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} error={error} />
    </div>
  )
}
