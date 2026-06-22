"use client"

import type { GlampingDetailItem } from "../types"
import { defaultGlampingDetail } from "../constants"

interface Props {
  glampingUnits: GlampingDetailItem[]
  setGlampingUnits: (v: GlampingDetailItem[]) => void
  error: string | null
  onBack: () => void
  onNext: () => void
}

export default function StepGlampingUnidades({
  glampingUnits, setGlampingUnits, error, onBack, onNext,
}: Props) {
  function updUnit(index: number, field: keyof GlampingDetailItem, val: string) {
    const next = [...glampingUnits]
    next[index] = { ...next[index], [field]: val }
    setGlampingUnits(next)
  }

  function addUnit() {
    setGlampingUnits([...glampingUnits, defaultGlampingDetail()])
  }

  function removeUnit(index: number) {
    setGlampingUnits(glampingUnits.filter((_, i) => i !== index))
  }

  return (
    <div style={{
      background: "#fff", border: "1px solid #e0ddd6", borderRadius: 20,
      padding: "28px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <p style={{ fontSize: 20, fontWeight: 700, color: "#1b1b19", marginBottom: 4 }}>
        Tipos de alojamiento
      </p>
      <p style={{ fontSize: 13, color: "#7a7669", marginBottom: 20 }}>
        Contanos qué tipos de cabañas, domos o carpas ofrece este lugar. Si tenés varios tamaños o categorías, agregá uno por cada tipo.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {glampingUnits.map((unit, index) => (
          <div key={index} style={{
            border: "1px solid #e0ddd6", borderRadius: 14, padding: "16px",
            display: "flex", flexDirection: "column", gap: 12, position: "relative",
          }}>
            {glampingUnits.length > 1 && (
              <button
                onClick={() => removeUnit(index)}
                style={{
                  position: "absolute", top: 10, right: 10,
                  background: "none", border: "none", color: "#9a9690",
                  cursor: "pointer", fontSize: 16, lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
            <p style={{ fontSize: 13, fontWeight: 700, color: "#2d6a4f", margin: 0 }}>
              Tipo {index + 1}
            </p>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#3d3d3a" }}>Tipo de alojamiento</label>
              <select
                value={unit.accommodation_type}
                onChange={e => updUnit(index, "accommodation_type", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0ddd6", borderRadius: 10, marginTop: 4 }}
              >
                <option value="">Seleccioná...</option>
                <option value="domo">Domo</option>
                <option value="carpa">Carpa equipada</option>
                <option value="cabaña">Cabaña</option>
                <option value="treehouse">Treehouse</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#3d3d3a" }}>Capacidad (personas)</label>
              <input
                type="number" value={unit.capacity}
                onChange={e => updUnit(index, "capacity", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0ddd6", borderRadius: 10, marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#3d3d3a" }}>Precio por noche</label>
              <input
                type="number" value={unit.price_per_night}
                onChange={e => updUnit(index, "price_per_night", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0ddd6", borderRadius: 10, marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#3d3d3a" }}>Mínimo de noches</label>
              <input
                type="number" value={unit.min_nights}
                onChange={e => updUnit(index, "min_nights", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0ddd6", borderRadius: 10, marginTop: 4 }}
              />
            </div>
          </div>
        ))}

        <button
          onClick={addUnit}
          style={{
            background: "none", border: "1px dashed #2d6a4f", color: "#2d6a4f",
            borderRadius: 12, padding: "10px 16px", cursor: "pointer",
            fontFamily: "inherit", fontWeight: 600, fontSize: 13,
          }}
        >
          + Agregar otro tipo de alojamiento
        </button>
      </div>

      {error && <p style={{ color: "#b91c1c", fontSize: 13, marginTop: 16 }}>{error}</p>}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <button onClick={onBack} style={{ background: "none", border: "1px solid #e0ddd6", borderRadius: 12, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit" }}>
          Atrás
        </button>
        <button onClick={onNext} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
          Continuar
        </button>
      </div>
    </div>
  )
}
