"use client"

import { useState } from "react"
import type { MotorhomeDetailItem, CampingDetailItem, GlampingDetailItem } from "../types"
import { GLAMPING_AMENITY_CATEGORIES, AMENITY_CATEGORIES, AMENITY_ICONS } from "../constants"
import { s, errorInputBorder, amenityChipStyle, sanitizeNum } from "../styles"
import Field from "../ui/Field"
import BinaryToggle from "../ui/BinaryToggle"
import NavRow from "../ui/NavRow"

interface Props {
  primaryCategoryName: string
  additionalCategories: string[]
  setAdditionalCategories: (v: string[]) => void
  motorhomeDetail: MotorhomeDetailItem
  setMotorhomeDetail: (v: MotorhomeDetailItem) => void
  campingDetail: CampingDetailItem
  setCampingDetail: (v: CampingDetailItem) => void
  glampingUnits: GlampingDetailItem[]
  setGlampingUnits: (v: GlampingDetailItem[]) => void
  selectedGlampingAmenities: string[]
  setSelectedGlampingAmenities: (v: string[]) => void
  selectedCampingAmenities: string[]
  setSelectedCampingAmenities: (v: string[]) => void
  error: string | null
  onBack: () => void
  onNext: () => void
}

const SECTION_BASE: React.CSSProperties = {
  background: "#f9f8f5",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "16px",
}
const SECTION_ACTIVE: React.CSSProperties = {
  background: "#f0f7f3",
  border: "1px solid var(--primary)",
}

export default function StepCategoriasAdicionales({
  primaryCategoryName,
  additionalCategories, setAdditionalCategories,
  motorhomeDetail, setMotorhomeDetail,
  campingDetail, setCampingDetail,
  glampingUnits, setGlampingUnits,
  selectedGlampingAmenities, setSelectedGlampingAmenities,
  selectedCampingAmenities, setSelectedCampingAmenities,
  error, onBack, onNext,
}: Props) {
  const acceptsMotorhome = additionalCategories.includes("Motorhome")
  const acceptsCamping = additionalCategories.includes("Camping")
  const acceptsGlamping = additionalCategories.includes("Glamping")

  const [motorhomeErrors, setMotorhomeErrors] = useState<Set<string>>(new Set())
  const [campingErrors, setCampingErrors] = useState<Set<string>>(new Set())
  const [glampingUnitErrors, setGlampingUnitErrors] = useState<Record<number, Set<string>>>({})

  function toggle(category: string) {
    setAdditionalCategories(
      additionalCategories.includes(category)
        ? additionalCategories.filter(c => c !== category)
        : [...additionalCategories, category]
    )
  }

  function toggleGlampingAmenity(name: string) {
    setSelectedGlampingAmenities(
      selectedGlampingAmenities.includes(name)
        ? selectedGlampingAmenities.filter(n => n !== name)
        : [...selectedGlampingAmenities, name]
    )
  }
  function toggleCampingAmenity(name: string) {
    setSelectedCampingAmenities(
      selectedCampingAmenities.includes(name)
        ? selectedCampingAmenities.filter(n => n !== name)
        : [...selectedCampingAmenities, name]
    )
  }

  function updMotorhome(field: keyof MotorhomeDetailItem, val: string | boolean | null) {
    setMotorhomeDetail({ ...motorhomeDetail, [field]: val })
    setMotorhomeErrors(prev => { const n = new Set(prev); n.delete(field as string); return n })
  }
  function updCamping(field: keyof CampingDetailItem, val: string) {
    setCampingDetail({ ...campingDetail, [field]: val })
    setCampingErrors(prev => { const n = new Set(prev); n.delete(field as string); return n })
  }
  function updGlampingUnit(index: number, field: keyof GlampingDetailItem, val: string) {
    const next = [...glampingUnits]
    next[index] = { ...next[index], [field]: val }
    setGlampingUnits(next)
    setGlampingUnitErrors(prev => {
      const unitSet = new Set(prev[index] ?? [])
      unitSet.delete(field as string)
      return { ...prev, [index]: unitSet }
    })
  }
  function addGlampingUnit() {
    setGlampingUnits([...glampingUnits, { accommodation_type: "", capacity: "", price_per_night: "", min_nights: "" }])
  }
  function removeGlampingUnit(index: number) {
    setGlampingUnits(glampingUnits.filter((_, i) => i !== index))
    setGlampingUnitErrors(prev => {
      const next: Record<number, Set<string>> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k)
        if (i < index) next[i] = v
        else if (i > index) next[i - 1] = v
      })
      return next
    })
  }

  function validate(): boolean {
    let ok = true

    if (acceptsMotorhome) {
      const missing = new Set<string>()
      if (!motorhomeDetail.capacity) missing.add("capacity")
      if (!motorhomeDetail.surface_type) missing.add("surface_type")
      if (motorhomeDetail.has_water === null) missing.add("has_water")
      if (motorhomeDetail.has_electricity === null) missing.add("has_electricity")
      if (motorhomeDetail.has_dump_station === null) missing.add("has_dump_station")
      if (missing.size > 0) { setMotorhomeErrors(missing); ok = false } else { setMotorhomeErrors(new Set()) }
    } else {
      setMotorhomeErrors(new Set())
    }

    if (acceptsGlamping) {
      const unitErrors: Record<number, Set<string>> = {}
      glampingUnits.forEach((unit, i) => {
        const missing = new Set<string>()
        if (!unit.accommodation_type) missing.add("accommodation_type")
        if (!unit.capacity) missing.add("capacity")
        if (!unit.price_per_night) missing.add("price_per_night")
        if (!unit.min_nights) missing.add("min_nights")
        if (missing.size > 0) { unitErrors[i] = missing; ok = false }
      })
      setGlampingUnitErrors(unitErrors)
    } else {
      setGlampingUnitErrors({})
    }

    if (acceptsCamping) {
      const missing = new Set<string>()
      if (!campingDetail.price) missing.add("price")
      if (missing.size > 0) { setCampingErrors(missing); ok = false } else { setCampingErrors(new Set()) }
    } else {
      setCampingErrors(new Set())
    }

    return ok
  }

  function handleNext() {
    if (!validate()) return
    onNext()
  }

  const offerGlamping = primaryCategoryName === "Camping" || primaryCategoryName === "Motorhome"
  const offerCamping = primaryCategoryName === "Glamping" || primaryCategoryName === "Motorhome"
  const hasValidationError = motorhomeErrors.size > 0 || campingErrors.size > 0 || Object.keys(glampingUnitErrors).length > 0

  return (
    <div style={s.card}>
      <h2 style={s.title}>¿Este lugar también ofrece...?</h2>
      <p style={s.subtitle}>
        Opcional. Si tu lugar tiene otras características, marcalas acá.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Motorhome */}
        {primaryCategoryName !== "Motorhome" && <div style={{ ...SECTION_BASE, ...(acceptsMotorhome ? SECTION_ACTIVE : {}) }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={acceptsMotorhome} onChange={() => toggle("Motorhome")} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>🚐 Acepta motorhomes</span>
          </label>
          {acceptsMotorhome && (
            <div style={{ ...s.form, padding: "14px 4px 4px" }}>
              <Field label="Capacidad (cantidad de motorhomes)" required={true} hasError={motorhomeErrors.has("capacity")} errorText="Completá la capacidad">
                <input
                  type="number" min={0} value={motorhomeDetail.capacity}
                  onChange={e => updMotorhome("capacity", sanitizeNum(e.target.value))}
                  style={{ ...s.input, ...(motorhomeErrors.has("capacity") ? errorInputBorder : {}) }}
                />
              </Field>
              <Field label="Tipo de superficie" required={true} hasError={motorhomeErrors.has("surface_type")} errorText="Seleccioná un tipo de superficie">
                <select
                  value={motorhomeDetail.surface_type}
                  onChange={e => updMotorhome("surface_type", e.target.value)}
                  style={{ ...s.input, ...(motorhomeErrors.has("surface_type") ? errorInputBorder : {}) }}
                >
                  <option value="">Seleccioná...</option>
                  <option value="cesped">Césped</option>
                  <option value="ripio">Ripio</option>
                  <option value="asfalto">Asfalto</option>
                  <option value="tierra">Tierra</option>
                </select>
              </Field>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 14, color: motorhomeErrors.has("has_water") ? "#e53e3e" : "#1b1b19" }}>
                  ¿Tiene agua? <span style={{ color: "#e53e3e", fontSize: 12 }}>*</span>
                </span>
                <BinaryToggle value={motorhomeDetail.has_water} onChange={v => updMotorhome("has_water", v)} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 14, color: motorhomeErrors.has("has_electricity") ? "#e53e3e" : "#1b1b19" }}>
                  ¿Tiene electricidad? <span style={{ color: "#e53e3e", fontSize: 12 }}>*</span>
                </span>
                <BinaryToggle value={motorhomeDetail.has_electricity} onChange={v => updMotorhome("has_electricity", v)} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 14, color: motorhomeErrors.has("has_dump_station") ? "#e53e3e" : "#1b1b19" }}>
                  ¿Tiene dump station? <span style={{ color: "#e53e3e", fontSize: 12 }}>*</span>
                </span>
                <BinaryToggle value={motorhomeDetail.has_dump_station} onChange={v => updMotorhome("has_dump_station", v)} />
              </div>
              <Field label="Noches máximas permitidas" required={false}>
                <input
                  type="number" min={0} value={motorhomeDetail.max_stay_nights}
                  onChange={e => updMotorhome("max_stay_nights", sanitizeNum(e.target.value))}
                  style={s.input}
                />
              </Field>
            </div>
          )}
        </div>}

        {/* Glamping (solo si la categoría principal es Camping) */}
        {offerGlamping && (
          <div style={{ ...SECTION_BASE, ...(acceptsGlamping ? SECTION_ACTIVE : {}) }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={acceptsGlamping} onChange={() => toggle("Glamping")} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>🛖 También tiene cabañas/domos (glamping)</span>
            </label>
            {acceptsGlamping && (
              <div style={{ ...s.form, padding: "14px 4px 4px" }}>
                {glampingUnits.map((unit, index) => {
                  const unitErrors = glampingUnitErrors[index] ?? new Set<string>()
                  return (
                    <div key={index} style={{ ...s.card, padding: "14px 16px", marginBottom: 0, position: "relative" }}>
                      {glampingUnits.length > 1 && (
                        <button onClick={() => removeGlampingUnit(index)} style={s.deleteBtn}>✕</button>
                      )}
                      <p style={s.cardTitle}>Tipo {index + 1}</p>
                      <div style={s.form}>
                        <Field label="Tipo de alojamiento" required={true} hasError={unitErrors.has("accommodation_type")} errorText="Seleccioná un tipo de alojamiento">
                          <select
                            value={unit.accommodation_type}
                            onChange={e => updGlampingUnit(index, "accommodation_type", e.target.value)}
                            style={{ ...s.input, ...(unitErrors.has("accommodation_type") ? errorInputBorder : {}) }}
                          >
                            <option value="">Seleccioná...</option>
                            <option value="domo">Domo</option>
                            <option value="carpa">Carpa equipada</option>
                            <option value="cabaña">Cabaña</option>
                            <option value="treehouse">Treehouse</option>
                            <option value="otro">Otro</option>
                          </select>
                        </Field>
                        <Field label="Capacidad (personas)" required={true} hasError={unitErrors.has("capacity")} errorText="Completá la capacidad">
                          <input
                            type="number" min={0} value={unit.capacity}
                            onChange={e => updGlampingUnit(index, "capacity", sanitizeNum(e.target.value))}
                            style={{ ...s.input, ...(unitErrors.has("capacity") ? errorInputBorder : {}) }}
                          />
                        </Field>
                        <Field label="Precio por noche" required={true} hasError={unitErrors.has("price_per_night")} errorText="Completá el precio por noche">
                          <input
                            type="number" min={0} value={unit.price_per_night}
                            onChange={e => updGlampingUnit(index, "price_per_night", sanitizeNum(e.target.value))}
                            style={{ ...s.input, ...(unitErrors.has("price_per_night") ? errorInputBorder : {}) }}
                          />
                        </Field>
                        <Field
                          label="Mínimo de noches" required={true} sublabel="Si no tiene mínimo, poné 0"
                          hasError={unitErrors.has("min_nights")} errorText="Completá el mínimo de noches (poné 0 si no hay mínimo)"
                        >
                          <input
                            type="number" min={0} value={unit.min_nights}
                            onChange={e => updGlampingUnit(index, "min_nights", sanitizeNum(e.target.value))}
                            style={{ ...s.input, ...(unitErrors.has("min_nights") ? errorInputBorder : {}) }}
                          />
                        </Field>
                      </div>
                    </div>
                  )
                })}
                <button style={s.btnAdd} onClick={addGlampingUnit}>+ Agregar otro tipo de alojamiento</button>

                <div style={{ marginTop: 8 }}>
                  <p style={s.cardTitle}>Amenities del glamping</p>
                  {GLAMPING_AMENITY_CATEGORIES.map(cat => (
                    <div key={cat.id} style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                        {cat.emoji} {cat.label}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {cat.names.map(name => {
                          const sel = selectedGlampingAmenities.includes(name)
                          return (
                            <button
                              key={name} type="button"
                              onClick={() => toggleGlampingAmenity(name)}
                              style={amenityChipStyle(sel)}
                            >
                              <span>{AMENITY_ICONS[name] ?? ""}</span>
                              <span>{name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Camping (solo si la categoría principal es Glamping) */}
        {offerCamping && (
          <div style={{ ...SECTION_BASE, ...(acceptsCamping ? SECTION_ACTIVE : {}) }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={acceptsCamping} onChange={() => toggle("Camping")} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>⛺ También permite acampar</span>
            </label>
            {acceptsCamping && (
              <div style={{ ...s.form, padding: "14px 4px 4px" }}>
                <Field label="Precio por noche (camping)" required={true} hasError={campingErrors.has("price")} errorText="Completá el precio (poné 0 si es gratis)">
                  <input
                    type="number" min={0} value={campingDetail.price}
                    onChange={e => updCamping("price", sanitizeNum(e.target.value))}
                    style={{ ...s.input, ...(campingErrors.has("price") ? errorInputBorder : {}) }}
                  />
                </Field>

                <div style={{ marginTop: 8 }}>
                  <p style={s.cardTitle}>Amenities del camping</p>
                  {AMENITY_CATEGORIES.map(cat => (
                    <div key={cat.id} style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                        {cat.emoji} {cat.label}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {cat.names.map(name => {
                          const sel = selectedCampingAmenities.includes(name)
                          return (
                            <button
                              key={name} type="button"
                              onClick={() => toggleCampingAmenity(name)}
                              style={amenityChipStyle(sel)}
                            >
                              <span>{AMENITY_ICONS[name] ?? ""}</span>
                              <span>{name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <NavRow
        onBack={onBack}
        onNext={handleNext}
        error={error || (hasValidationError ? "Completá los campos marcados en rojo antes de continuar." : null)}
      />
    </div>
  )
}
