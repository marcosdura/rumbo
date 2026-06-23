"use client"

import dynamic from "next/dynamic"
import { useState, useEffect, useRef } from "react"
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

const ERROR_BORDER: CSSProperties = { borderColor: "#e53e3e" }

export default function StepInfoBasica({
  basic, setBasic, upd, isPublic, setIsPublic, publicTransport, setPublicTransport,
  error, onBack, onNext, title = "Información básica",
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
}) {
  const [emailError, setEmailError] = useState<string | null>(null)
  const [nameTaken, setNameTaken] = useState(false)
  const [checkingName, setCheckingName] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const name = basic.name.trim()
    if (!name) { setNameTaken(false); return }
    debounceRef.current = setTimeout(async () => {
      setCheckingName(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/check-name?name=${encodeURIComponent(name)}`)
        const data = await res.json()
        setNameTaken(!!data.exists)
      } catch {
        setNameTaken(false)
      } finally {
        setCheckingName(false)
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [basic.name])

  function validate(): boolean {
    const missing = new Set<string>()
    if (!basic.name.trim()) missing.add("name")
    if (nameTaken) missing.add("name")
    if (!basic.description.trim()) missing.add("description")
    if (!basic.department) missing.add("department")
    if (!basic.price.trim()) missing.add("price")
    if (basic.season_type === "seasonal") {
      if (!basic.season_start) missing.add("season_start")
      if (!basic.season_end) missing.add("season_end")
    }
    if (!basic.email.trim() && !basic.whatsapp.trim() && !basic.instagram.trim()) {
      missing.add("contact")
    }
    if (basic.email.trim() && !isValidEmail(basic.email)) missing.add("email")
    if (isPublic === null) missing.add("isPublic")
    if (!basic.lat || !basic.lng) missing.add("location")
    setFieldErrors(missing)
    return missing.size === 0
  }

  function handleNext() {
    if (!validate()) return
    onNext()
  }

  return (
    <div>
      <h2 style={s.title}>{title}</h2>
      <div style={s.form}>
        <Field label="Nombre del lugar" required={true} hasError={fieldErrors.has("name")}
          errorText={nameTaken ? "Ya existe un lugar con este nombre" : "El nombre es obligatorio"}>
          <input
            style={{ ...s.input, ...(fieldErrors.has("name") ? ERROR_BORDER : {}) }}
            type="text" value={basic.name} onChange={e => upd("name", e.target.value)}
          />
          {checkingName && <p style={{ fontSize: 12, color: "#9a9690", margin: "4px 0 0" }}>Verificando nombre...</p>}
        </Field>
        <Field label="Descripción" required={true} hasError={fieldErrors.has("description")} errorText="La descripción es obligatoria">
          <textarea
            style={{ ...s.input, height: 96, resize: "vertical", ...(fieldErrors.has("description") ? ERROR_BORDER : {}) } as CSSProperties}
            value={basic.description}
            onChange={e => upd("description", e.target.value)}
            placeholder="Contá cómo es el lugar, qué lo hace especial, qué pueden esperar quienes lo visiten. Cuanto más detalle, mejor."
          />
        </Field>
        <Field label="Departamento" required={true} hasError={fieldErrors.has("department")} errorText="Seleccioná un departamento">
          <select
            style={{ ...s.input, ...(fieldErrors.has("department") ? ERROR_BORDER : {}) }}
            value={basic.department} onChange={e => upd("department", e.target.value)}
          >
            <option value="">Seleccioná...</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <div className="form-two-col">
          <Field label="Precio" required={true} sublabel="Si el acceso es gratuito, poné 0" hasError={fieldErrors.has("price")} errorText="Completá el precio (poné 0 si es gratis)">
            <input
              style={{ ...s.input, ...(fieldErrors.has("price") ? ERROR_BORDER : {}) }}
              type="number" value={basic.price} onChange={e => upd("price", e.target.value)}
            />
          </Field>
          <div />
        </div>
        <div style={fieldErrors.has("season_start") || fieldErrors.has("season_end") ? { border: "1px solid #e53e3e", borderRadius: 12, padding: 10 } : {}}>
          <SeasonToggle
            type={basic.season_type}
            onTypeChange={t => setBasic(prev => ({ ...prev, season_type: t }))}
            start={basic.season_start}
            onStartChange={v => upd("season_start", v)}
            end={basic.season_end}
            onEndChange={v => upd("season_end", v)}
          />
          {(fieldErrors.has("season_start") || fieldErrors.has("season_end")) && (
            <p style={{ fontSize: 12, color: "#e53e3e", margin: "4px 0 0" }}>Completá el inicio y el fin de temporada</p>
          )}
        </div>
        <div className="form-two-col">
          <Field label="Email del lugar" required={false}>
            <>
              <input
                style={{ ...s.input, ...(fieldErrors.has("email") ? ERROR_BORDER : {}) }}
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
            <input
              style={{ ...s.input, ...(fieldErrors.has("contact") ? ERROR_BORDER : {}) }}
              type="text" placeholder="Ej: 099123456" value={basic.whatsapp} onChange={e => upd("whatsapp", e.target.value)}
            />
          </Field>
        </div>
        <div className="form-two-col">
          <Field label="Instagram" required={false}>
            <input
              style={{ ...s.input, ...(fieldErrors.has("contact") ? ERROR_BORDER : {}) }}
              type="text" placeholder="@usuario" value={basic.instagram} onChange={e => upd("instagram", e.target.value)}
            />
          </Field>
          <div />
        </div>
        {fieldErrors.has("contact") && (
          <p style={{ fontSize: 12, color: "#e53e3e", margin: "-8px 0 0" }}>
            Completá al menos un método de contacto (email, WhatsApp o Instagram)
          </p>
        )}

        {/* ¿Público o privado? */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: fieldErrors.has("isPublic") ? "#e53e3e" : "#1b1b19" }}>
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
                  border: `1px solid ${isPublic === opt.value ? "#2d6a4f" : fieldErrors.has("isPublic") ? "#e53e3e" : "#e0ddd6"}`,
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

        <div style={fieldErrors.has("location") ? { border: "1px solid #e53e3e", borderRadius: 12, padding: 10 } : {}}>
          <LocationPicker
            lat={basic.lat ? parseFloat(basic.lat) : null}
            lng={basic.lng ? parseFloat(basic.lng) : null}
            onLocationSelect={(lat: number, lng: number) => {
              upd("lat", String(lat))
              upd("lng", String(lng))
            }}
          />
          {fieldErrors.has("location") && (
            <p style={{ fontSize: 12, color: "#e53e3e", margin: "4px 0 0" }}>Seleccioná una ubicación en el mapa</p>
          )}
        </div>
      </div>
      <NavRow onBack={onBack} onNext={handleNext} error={error ?? (fieldErrors.size > 0 ? "Completá los campos marcados en rojo." : null)} />
    </div>
  )
}
