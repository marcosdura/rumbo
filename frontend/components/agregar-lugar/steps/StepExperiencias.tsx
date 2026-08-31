"use client"

import type React from "react"
import { s, errorHintText, sanitizeNum } from "../styles"
import NavRow from "../ui/NavRow"
import Field from "../ui/Field"
import { EXPERIENCE_SCHEDULE_OPTIONS, defaultExperience } from "../constants"
import type { ExperienceItem, ExperienceScheduleType } from "../types"

const EXPERIENCE_CATEGORIES = [
  { id: 2, emoji: "🥾", label: "Trekking" },
  { id: 3, emoji: "🧗", label: "Escalada" },
  { id: 4, emoji: "🏄", label: "Surf" },
  { id: 5, emoji: "🛶", label: "Kayak" },
]

function upd(
  setExperiences: React.Dispatch<React.SetStateAction<ExperienceItem[]>>,
  index: number,
  field: keyof ExperienceItem,
  value: string,
) {
  setExperiences(prev =>
    prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp)),
  )
}

export default function StepExperiencias({
  experiences,
  setExperiences,
  error,
  onBack,
  onNext,
}: {
  experiences: ExperienceItem[]
  setExperiences: React.Dispatch<React.SetStateAction<ExperienceItem[]>>
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <h2 style={{ ...s.title, marginBottom: 0 }}>Experiencias</h2>
        <span
          onClick={onNext}
          style={{ fontSize: 13, color: "var(--muted)", cursor: "pointer", textDecoration: "underline", marginTop: 4, flexShrink: 0 }}
        >
          Omitir
        </span>
      </div>
      <p style={{ ...s.subtitle, marginBottom: 20 }}>
        Agregá las actividades que ofrece tu lugar. Los visitantes podrán encontrar tu spot cuando busquen estas categorías.
      </p>

      <div style={s.form}>
        {experiences.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Todavía no agregaste experiencias. Si tu lugar ofrece actividades como trekking, cabalgatas o pesca, podés agregarlas acá.
          </p>
        ) : (
          experiences.map((exp, index) => (
            <ExperienceCard
              key={index}
              index={index}
              exp={exp}
              setExperiences={setExperiences}
            />
          ))
        )}

        <button
          type="button"
          onClick={() => setExperiences(prev => [...prev, defaultExperience()])}
          style={s.btnAdd}
        >
          ＋ Agregar experiencia
        </button>
      </div>

      <NavRow onBack={onBack} onNext={onNext} error={error} />
    </div>
  )
}

function ExperienceCard({
  index,
  exp,
  setExperiences,
}: {
  index: number
  exp: ExperienceItem
  setExperiences: React.Dispatch<React.SetStateAction<ExperienceItem[]>>
}) {
  const hasTitleNoCat = exp.title.trim() !== "" && exp.category_id === ""

  return (
    <div style={{ ...s.card, position: "relative" }}>
      <button
        type="button"
        onClick={() => setExperiences(prev => prev.filter((_, i) => i !== index))}
        style={s.deleteBtn}
      >
        ✕
      </button>

      <div style={s.form}>
        {/* Category */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#1b1b19", marginBottom: 8 }}>
            Categoría <span style={{ fontSize: 12, color: "#e53e3e" }}>*</span>
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EXPERIENCE_CATEGORIES.map(cat => {
              const selected = exp.category_id === String(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => upd(setExperiences, index, "category_id", String(cat.id))}
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 13,
                    border: `1px solid ${selected ? "var(--primary)" : "var(--border)"}`,
                    background: selected ? "var(--primary)" : "#fff",
                    color: selected ? "#fff" : "#1b1b19",
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {cat.emoji} {cat.label}
                </button>
              )
            })}
          </div>
          {hasTitleNoCat && (
            <p style={errorHintText}>Seleccioná una categoría para esta experiencia.</p>
          )}
        </div>

        {/* Title */}
        <Field label="Título" required={true}>
          <input
            style={s.input}
            type="text"
            placeholder="Ej: Trekking al Cerro Grande"
            value={exp.title}
            onChange={e => upd(setExperiences, index, "title", e.target.value)}
          />
        </Field>

        {/* Description */}
        <Field label="Descripción" required={false}>
          <textarea
            style={{ ...s.input, height: 80, resize: "vertical" } as React.CSSProperties}
            placeholder="Contá de qué se trata, qué incluye, qué nivel se requiere..."
            value={exp.description}
            onChange={e => upd(setExperiences, index, "description", e.target.value)}
          />
        </Field>

        {/* Price */}
        <Field label="Precio" required={false} sublabel="Dejá vacío si el precio varía o se consulta">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#7a7669", flexShrink: 0 }}>$ UYU</span>
            <input
              style={s.input}
              type="number"
              min={0}
              value={exp.price}
              onChange={e => upd(setExperiences, index, "price", sanitizeNum(e.target.value))}
            />
          </div>
        </Field>

        {/* Schedule */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#1b1b19", marginBottom: 8 }}>
            Horario / Frecuencia <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 400 }}>(opcional)</span>
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EXPERIENCE_SCHEDULE_OPTIONS.map(opt => {
              const selected = exp.schedule_type === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    upd(
                      setExperiences,
                      index,
                      "schedule_type",
                      selected ? "" : opt.value,
                    )
                  }
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 13,
                    border: `1px solid ${selected ? "var(--primary)" : "var(--border)"}`,
                    background: selected ? "var(--primary)" : "#fff",
                    color: selected ? "#fff" : "#1b1b19",
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          {exp.schedule_type === "personalizado" && (
            <input
              style={{ ...s.input, marginTop: 10 }}
              type="text"
              placeholder="Ej: Primer sábado de cada mes, solo en temporada de verano..."
              value={exp.schedule_custom}
              onChange={e => upd(setExperiences, index, "schedule_custom", e.target.value)}
            />
          )}
        </div>

        {/* Contact */}
        <Field label="Contacto" required={false} sublabel="Si el contacto es el mismo del lugar, podés dejarlo vacío">
          <input
            style={s.input}
            type="text"
            placeholder="WhatsApp, email o Instagram"
            value={exp.contact}
            onChange={e => upd(setExperiences, index, "contact", e.target.value)}
          />
        </Field>
      </div>
    </div>
  )
}
