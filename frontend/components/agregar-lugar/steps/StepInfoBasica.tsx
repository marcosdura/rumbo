"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import type { CSSProperties } from "react"
import type React from "react"
import { DEPARTMENTS } from "../constants"
import { s } from "../styles"
import Field from "../ui/Field"
import SeasonToggle from "../ui/SeasonToggle"
import NavRow from "../ui/NavRow"
import type { BasicInfo } from "../types"

const LocationPicker = dynamic(
  () => import("@/components/forms/LocationPicker"),
  { ssr: false }
)

export default function StepInfoBasica({
  basic, setBasic, upd, isPublic, setIsPublic, publicTransport, setPublicTransport,
  error, onBack, onNext, title = "Información básica", stepLabel,
}: {
  basic: BasicInfo
  setBasic: React.Dispatch<React.SetStateAction<BasicInfo>>
  upd: (field: string, val: string) => void
  isPublic: boolean | null
  setIsPublic: (v: boolean | null) => void
  publicTransport: string | null
  setPublicTransport: React.Dispatch<React.SetStateAction<string | null>>
  error: string | null
  onBack: () => void
  onNext: () => void
  title?: string
  stepLabel?: string
}) {
  const [emailError, setEmailError] = useState<string | null>(null)

  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function handleEmailBlur() {
    if (basic.email.trim() && !isValidEmail(basic.email)) {
      setEmailError("Ingresá un email válido")
    } else {
      setEmailError(null)
    }
  }

  return (
    <div>
      <h2 style={s.title}>{title}</h2>
      <div style={s.form}>
        <Field label="Nombre del lugar" required={true}>
          <input style={s.input} type="text" value={basic.name} onChange={e => upd("name", e.target.value)} />
        </Field>
        <Field label="Descripción" required={true}>
          <textarea
            style={{ ...s.input, height: 96, resize: "vertical" } as CSSProperties}
            value={basic.description}
            onChange={e => upd("description", e.target.value)}
            placeholder="Contá cómo es el lugar, qué lo hace especial, qué pueden esperar quienes lo visiten. Cuanto más detalle, mejor."
          />
        </Field>
        <Field label="Departamento" required={true}>
          <select style={s.input} value={basic.department} onChange={e => upd("department", e.target.value)}>
            <option value="">Seleccioná...</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <div className="form-two-col">
          <Field label="Precio" required={false}>
            <input style={s.input} type="number" value={basic.price} onChange={e => upd("price", e.target.value)} />
          </Field>
          <div />
        </div>
        <SeasonToggle
          type={basic.season_type}
          onTypeChange={t => setBasic(prev => ({ ...prev, season_type: t }))}
          start={basic.season_start}
          onStartChange={v => upd("season_start", v)}
          end={basic.season_end}
          onEndChange={v => upd("season_end", v)}
        />
        <div className="form-two-col">
          <Field label="Email del lugar" required={false}>
            <>
              <input
                style={s.input}
                type="email"
                value={basic.email}
                onChange={e => { upd("email", e.target.value); if (!e.target.value.trim()) setEmailError(null) }}
                onBlur={handleEmailBlur}
              />
              {emailError && (
                <p style={{ fontSize: 12, color: "#c0392b", margin: "4px 0 0" }}>{emailError}</p>
              )}
            </>
          </Field>
          <Field label="WhatsApp" required={false}>
            <input style={s.input} type="text" placeholder="Ej: 099123456" value={basic.whatsapp} onChange={e => upd("whatsapp", e.target.value)} />
          </Field>
        </div>
        <div className="form-two-col">
          <Field label="Instagram" required={false}>
            <input style={s.input} type="text" placeholder="@usuario" value={basic.instagram} onChange={e => upd("instagram", e.target.value)} />
          </Field>
          <div />
        </div>

        {/* ¿Público o privado? */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#1b1b19" }}>
            ¿El lugar es público o privado?{" "}
            <span style={{ fontSize: 12, color: "#e53e3e", fontWeight: 400 }}>(obligatorio)</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {([
              { value: true,  label: "🏛️ Público" },
              { value: false, label: "🔒 Privado" },
            ] as { value: boolean; label: string }[]).map(opt => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setIsPublic(opt.value)}
                style={{
                  padding: "6px 16px", borderRadius: 20,
                  border: `1px solid ${isPublic === opt.value ? "#2d6a4f" : "#e0ddd6"}`,
                  background: isPublic === opt.value ? "#2d6a4f" : "#f7f5f0",
                  color: isPublic === opt.value ? "#fff" : "#1b1b19",
                  fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ¿Accesible en transporte público? */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#1b1b19" }}>
            ¿Es accesible en transporte público?{" "}
            <span style={{ fontSize: 12, color: "#9a9690", fontWeight: 400 }}>(opcional)</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {([
              { value: "si",   label: "✅ Sí" },
              { value: "no",   label: "❌ No" },
              { value: "nose", label: "🤷 No sé" },
            ] as { value: string; label: string }[]).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPublicTransport(prev => prev === opt.value ? null : opt.value)}
                style={{
                  padding: "6px 16px", borderRadius: 20,
                  border: `1px solid ${publicTransport === opt.value ? "#2d6a4f" : "#e0ddd6"}`,
                  background: publicTransport === opt.value ? "#2d6a4f" : "#f7f5f0",
                  color: publicTransport === opt.value ? "#fff" : "#1b1b19",
                  fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <LocationPicker
          lat={basic.lat ? parseFloat(basic.lat) : null}
          lng={basic.lng ? parseFloat(basic.lng) : null}
          onLocationSelect={(lat: number, lng: number) => {
            upd("lat", String(lat))
            upd("lng", String(lng))
          }}
        />
      </div>
      <NavRow onBack={onBack} onNext={onNext} error={error} stepLabel={stepLabel} />
    </div>
  )
}
