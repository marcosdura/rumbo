"use client"

import { MOTORHOME_SURFACE_TYPES } from "../agregar-lugar/constants"
import type { MotorhomeAmenities } from "../agregar-lugar/types"

export default function MotorhomeFields({
  value, onChange,
}: {
  value: MotorhomeAmenities
  onChange: (next: MotorhomeAmenities) => void
}) {
  function set<K extends keyof MotorhomeAmenities>(key: K, v: MotorhomeAmenities[K]) {
    onChange({ ...value, [key]: v })
  }

  return (
    <div style={{
      border: "1px solid #e0ddd6",
      borderRadius: 20,
      padding: 16,
      marginTop: 16,
      background: "#f5f4f0",
    }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>
        <input
          type="checkbox"
          checked={value.acceptsMotorhomes}
          onChange={(e) => set("acceptsMotorhomes", e.target.checked)}
          style={{ width: 18, height: 18, accentColor: "#2d6a4f" }}
        />
        🚐 ¿Este lugar tiene espacio para motorhomes?
      </label>

      {value.acceptsMotorhomes && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#7a7669", marginBottom: 4 }}>
              Capacidad (cantidad de motorhomes)
            </label>
            <input
              type="number"
              min={0}
              value={value.motorhomeCapacity ?? ""}
              onChange={(e) => set("motorhomeCapacity", e.target.value)}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 10,
                border: "1px solid #e0ddd6", fontSize: 14, fontFamily: "inherit",
                background: "#fff",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#7a7669", marginBottom: 4 }}>
              Tipo de superficie
            </label>
            <select
              value={value.motorhomeSurfaceType ?? ""}
              onChange={(e) => set("motorhomeSurfaceType", e.target.value as MotorhomeAmenities["motorhomeSurfaceType"])}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 10,
                border: "1px solid #e0ddd6", fontSize: 14, fontFamily: "inherit",
                background: "#fff",
              }}
            >
              <option value="">Seleccionar...</option>
              {MOTORHOME_SURFACE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#1b1b19" }}>
            <input
              type="checkbox"
              checked={value.motorhomeHasWater ?? false}
              onChange={(e) => set("motorhomeHasWater", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#2d6a4f" }}
            />
            💧 Tiene agua
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#1b1b19" }}>
            <input
              type="checkbox"
              checked={value.motorhomeHasElectricity ?? false}
              onChange={(e) => set("motorhomeHasElectricity", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#2d6a4f" }}
            />
            ⚡ Tiene electricidad
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#1b1b19" }}>
            <input
              type="checkbox"
              checked={value.motorhomeHasDumpStation ?? false}
              onChange={(e) => set("motorhomeHasDumpStation", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#2d6a4f" }}
            />
            🚽 Tiene punto de vaciado (dump station)
          </label>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#7a7669", marginBottom: 4 }}>
              Máximo de noches permitidas
            </label>
            <input
              type="number"
              min={0}
              value={value.motorhomeMaxStayNights ?? ""}
              onChange={(e) => set("motorhomeMaxStayNights", e.target.value)}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 10,
                border: "1px solid #e0ddd6", fontSize: 14, fontFamily: "inherit",
                background: "#fff",
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
