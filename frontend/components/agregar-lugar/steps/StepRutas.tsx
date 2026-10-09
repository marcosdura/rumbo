"use client"

import { useState } from "react"
import type React from "react"
import { defaultRoute } from "../constants"
import { s, errorInputBorder, sanitizeNum } from "../styles"
import { namedCount, unnamedRows } from "../validation"
import Field from "../ui/Field"
import NavRow from "../ui/NavRow"
import ItemPhotoPicker from "../ui/ItemPhotoPicker"
import type { RouteItem } from "../types"

export default function StepRutas({
  routes, setRoutes, required = false, onBack, onNext,
}: {
  routes: RouteItem[]
  setRoutes: React.Dispatch<React.SetStateAction<RouteItem[]>>
  // Sumando rutas a un lugar existente: al menos una.
  required?: boolean
  onBack: () => void
  onNext: () => void
}) {
  const [nameErrors, setNameErrors] = useState<Set<number>>(new Set())
  const [stepError, setStepError] = useState<string | null>(null)

  function updRoute(i: number, field: string, val: string) {
    setRoutes(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
    if (field === "name") setNameErrors(prev => { const n = new Set(prev); n.delete(i); return n })
    setStepError(null)
  }

  function removeRoute(i: number) {
    setRoutes(prev => prev.filter((_, idx) => idx !== i))
    setNameErrors(new Set())
  }

  function handleNext() {
    const unnamed = unnamedRows(routes)
    setNameErrors(new Set(unnamed))
    if (unnamed.length > 0) { setStepError("Completá el nombre de cada ruta."); return }
    if (required && namedCount(routes) === 0) { setStepError("Agregá al menos una ruta."); return }
    setStepError(null)
    onNext()
  }

  return (
    <div>
      <h2 style={s.title}>Rutas</h2>
      {!required && (
        <p style={s.subtitle}>Opcional: podés cargarlas ahora o más adelante desde el panel del lugar.</p>
      )}
      {routes.map((r, i) => (
        <div key={i} style={{ ...s.card, position: "relative" }}>
          {routes.length > 1 && (
            <button onClick={() => removeRoute(i)} style={s.deleteBtn} aria-label={`Quitar ruta ${i + 1}`}>✕</button>
          )}
          <p style={s.cardTitle}>Ruta {i + 1}</p>
          <div style={s.form}>
            <Field label="Nombre" required={true} hasError={nameErrors.has(i)} errorText="El nombre de la ruta es obligatorio">
              <input
                aria-label={`Nombre de la ruta ${i + 1}`}
                style={{ ...s.input, ...(nameErrors.has(i) ? errorInputBorder : {}) }}
                value={r.name} onChange={e => updRoute(i, "name", e.target.value)}
              />
            </Field>
            <Field label="Descripción" required={false}>
              <textarea
                aria-label={`Descripción de la ruta ${i + 1}`}
                style={{ ...s.input, height: 88, resize: "vertical" } as React.CSSProperties}
                maxLength={2000}
                placeholder="Por dónde va, qué se ve, qué tener en cuenta…"
                value={r.description} onChange={e => updRoute(i, "description", e.target.value)}
              />
            </Field>
            <ItemPhotoPicker
              label={`Fotos de la ruta ${i + 1}`}
              files={r.photos ?? []}
              onChange={photos => setRoutes(prev => prev.map((x, idx) => idx === i ? { ...x, photos } : x))}
            />
            <div className="form-two-col">
              <Field label="Distancia (km)" required={false}><input style={s.input} type="number" step="any" min={0} value={r.distance_km} onChange={e => updRoute(i, "distance_km", sanitizeNum(e.target.value))} /></Field>
              <Field label="Duración (horas)" required={false}><input style={s.input} type="number" step="any" min={0} value={r.duration_hours} onChange={e => updRoute(i, "duration_hours", sanitizeNum(e.target.value))} /></Field>
            </div>
            <div className="form-two-col">
              <Field label="Desnivel positivo (m)" required={false}><input style={s.input} type="number" min={0} value={r.elevation_gain} onChange={e => updRoute(i, "elevation_gain", sanitizeNum(e.target.value))} /></Field>
              <Field label="Desnivel negativo (m)" required={false}><input style={s.input} type="number" min={0} value={r.elevation_loss} onChange={e => updRoute(i, "elevation_loss", sanitizeNum(e.target.value))} /></Field>
            </div>
            <div className="form-two-col">
              <Field label="Altitud máxima (m)" required={false}><input style={s.input} type="number" min={0} value={r.max_altitude} onChange={e => updRoute(i, "max_altitude", sanitizeNum(e.target.value))} /></Field>
              <Field label="Altitud mínima (m)" required={false}><input style={s.input} type="number" min={0} value={r.min_altitude} onChange={e => updRoute(i, "min_altitude", sanitizeNum(e.target.value))} /></Field>
            </div>
            <div className="form-two-col">
              <Field label="Dificultad" required={false}>
                <select style={s.input} value={r.difficulty} onChange={e => updRoute(i, "difficulty", e.target.value)}>
                  <option value="">-</option>
                  <option value="fácil">Fácil</option>
                  <option value="moderado">Moderado</option>
                  <option value="difícil">Difícil</option>
                </select>
              </Field>
              <Field label="Tipo de ruta" required={false}>
                <select style={s.input} value={r.route_type} onChange={e => updRoute(i, "route_type", e.target.value)}>
                  <option value="">-</option>
                  <option value="circular">Circular</option>
                  <option value="ida y vuelta">Ida y vuelta</option>
                </select>
              </Field>
            </div>
            <div className="form-two-col">
              <Field label="Nivel técnico" required={false}>
                <select style={s.input} value={r.technical_level} onChange={e => updRoute(i, "technical_level", e.target.value)}>
                  <option value="">-</option>
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </select>
              </Field>
              <Field label="Demanda física" required={false}>
                <select style={s.input} value={r.physical_demand} onChange={e => updRoute(i, "physical_demand", e.target.value)}>
                  <option value="">-</option>
                  <option value="bajo">Baja</option>
                  <option value="medio">Media</option>
                  <option value="alto">Alta</option>
                </select>
              </Field>
            </div>
          </div>
        </div>
      ))}
      <button style={s.btnAdd} onClick={() => setRoutes(prev => [...prev, defaultRoute()])}>+ Agregar ruta</button>
      <NavRow onBack={onBack} onNext={handleNext} error={stepError} />
    </div>
  )
}
