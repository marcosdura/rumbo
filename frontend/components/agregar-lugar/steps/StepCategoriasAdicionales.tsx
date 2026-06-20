"use client"

import type { MotorhomeDetailItem } from "../types"

interface Props {
  additionalCategories: string[]
  setAdditionalCategories: (v: string[]) => void
  motorhomeDetail: MotorhomeDetailItem
  setMotorhomeDetail: (v: MotorhomeDetailItem) => void
  error: string | null
  onBack: () => void
  onNext: () => void
}

export default function StepCategoriasAdicionales({
  additionalCategories, setAdditionalCategories,
  motorhomeDetail, setMotorhomeDetail,
  error, onBack, onNext,
}: Props) {
  const acceptsMotorhome = additionalCategories.includes("Motorhome")

  function toggleMotorhome() {
    setAdditionalCategories(
      acceptsMotorhome
        ? additionalCategories.filter(c => c !== "Motorhome")
        : [...additionalCategories, "Motorhome"]
    )
  }

  function updMotorhome(field: keyof MotorhomeDetailItem, val: string | boolean) {
    setMotorhomeDetail({ ...motorhomeDetail, [field]: val })
  }

  return (
    <div style={{
      background: "#fff", border: "1px solid #e0ddd6", borderRadius: 20,
      padding: "28px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <p style={{ fontSize: 20, fontWeight: 700, color: "#1b1b19", marginBottom: 4 }}>
        ¿Este lugar también ofrece...?
      </p>
      <p style={{ fontSize: 13, color: "#7a7669", marginBottom: 20 }}>
        Opcional. Si tu lugar tiene otras características, marcalas acá.
      </p>

      <label style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 16px", border: "1px solid #e0ddd6", borderRadius: 12,
        cursor: "pointer", marginBottom: acceptsMotorhome ? 16 : 0,
      }}>
        <input type="checkbox" checked={acceptsMotorhome} onChange={toggleMotorhome} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>🚐 Acepta motorhomes</span>
      </label>

      {acceptsMotorhome && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 0 0 4px" }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#3d3d3a" }}>Capacidad (cantidad de motorhomes)</label>
            <input
              type="number" value={motorhomeDetail.capacity}
              onChange={e => updMotorhome("capacity", e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0ddd6", borderRadius: 10, marginTop: 4 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#3d3d3a" }}>Tipo de superficie</label>
            <select
              value={motorhomeDetail.surface_type}
              onChange={e => updMotorhome("surface_type", e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0ddd6", borderRadius: 10, marginTop: 4 }}
            >
              <option value="">Seleccioná...</option>
              <option value="cesped">Césped</option>
              <option value="ripio">Ripio</option>
              <option value="asfalto">Asfalto</option>
              <option value="tierra">Tierra</option>
            </select>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={motorhomeDetail.has_water} onChange={e => updMotorhome("has_water", e.target.checked)} />
            Tiene agua
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={motorhomeDetail.has_electricity} onChange={e => updMotorhome("has_electricity", e.target.checked)} />
            Tiene electricidad
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={motorhomeDetail.has_dump_station} onChange={e => updMotorhome("has_dump_station", e.target.checked)} />
            Tiene dump station
          </label>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#3d3d3a" }}>Noches máximas permitidas</label>
            <input
              type="number" value={motorhomeDetail.max_stay_nights}
              onChange={e => updMotorhome("max_stay_nights", e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0ddd6", borderRadius: 10, marginTop: 4 }}
            />
          </div>
        </div>
      )}

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
