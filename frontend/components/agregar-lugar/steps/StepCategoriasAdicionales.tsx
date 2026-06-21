"use client"

import type { MotorhomeDetailItem, CampingDetailItem, GlampingDetailItem } from "../types"
import { GLAMPING_AMENITY_CATEGORIES, AMENITY_CATEGORIES, AMENITY_ICONS } from "../constants"

interface Props {
  primaryCategoryName: string
  additionalCategories: string[]
  setAdditionalCategories: (v: string[]) => void
  motorhomeDetail: MotorhomeDetailItem
  setMotorhomeDetail: (v: MotorhomeDetailItem) => void
  campingDetail: CampingDetailItem
  setCampingDetail: (v: CampingDetailItem) => void
  glampingDetail: GlampingDetailItem
  setGlampingDetail: (v: GlampingDetailItem) => void
  selectedGlampingAmenities: string[]
  setSelectedGlampingAmenities: (v: string[]) => void
  selectedCampingAmenities: string[]
  setSelectedCampingAmenities: (v: string[]) => void
  error: string | null
  onBack: () => void
  onNext: () => void
}

export default function StepCategoriasAdicionales({
  primaryCategoryName,
  additionalCategories, setAdditionalCategories,
  motorhomeDetail, setMotorhomeDetail,
  campingDetail, setCampingDetail,
  glampingDetail, setGlampingDetail,
  selectedGlampingAmenities, setSelectedGlampingAmenities,
  selectedCampingAmenities, setSelectedCampingAmenities,
  error, onBack, onNext,
}: Props) {
  const acceptsMotorhome = additionalCategories.includes("Motorhome")
  const acceptsCamping = additionalCategories.includes("Camping")
  const acceptsGlamping = additionalCategories.includes("Glamping")

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

  function updMotorhome(field: keyof MotorhomeDetailItem, val: string | boolean) {
    setMotorhomeDetail({ ...motorhomeDetail, [field]: val })
  }
  function updCamping(field: keyof CampingDetailItem, val: string) {
    setCampingDetail({ ...campingDetail, [field]: val })
  }
  function updGlamping(field: keyof GlampingDetailItem, val: string) {
    setGlampingDetail({ ...glampingDetail, [field]: val })
  }

  const offerGlamping = primaryCategoryName === "Camping"
  const offerCamping = primaryCategoryName === "Glamping"

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

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Motorhome */}
        <div>
          <label style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 16px", border: "1px solid #e0ddd6", borderRadius: 12,
            cursor: "pointer",
          }}>
            <input type="checkbox" checked={acceptsMotorhome} onChange={() => toggle("Motorhome")} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>🚐 Acepta motorhomes</span>
          </label>
          {acceptsMotorhome && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "14px 4px 4px" }}>
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
        </div>

        {/* Glamping (solo si la categoría principal es Camping) */}
        {offerGlamping && (
          <div>
            <label style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 16px", border: "1px solid #e0ddd6", borderRadius: 12,
              cursor: "pointer",
            }}>
              <input type="checkbox" checked={acceptsGlamping} onChange={() => toggle("Glamping")} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>🛖 También tiene cabañas/domos (glamping)</span>
            </label>
            {acceptsGlamping && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "14px 4px 4px" }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#3d3d3a" }}>Tipo de alojamiento</label>
                  <select
                    value={glampingDetail.accommodation_type}
                    onChange={e => updGlamping("accommodation_type", e.target.value)}
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
                    type="number" value={glampingDetail.capacity}
                    onChange={e => updGlamping("capacity", e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0ddd6", borderRadius: 10, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#3d3d3a" }}>Precio por noche</label>
                  <input
                    type="number" value={glampingDetail.price_per_night}
                    onChange={e => updGlamping("price_per_night", e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0ddd6", borderRadius: 10, marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#3d3d3a" }}>Mínimo de noches</label>
                  <input
                    type="number" value={glampingDetail.min_nights}
                    onChange={e => updGlamping("min_nights", e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0ddd6", borderRadius: 10, marginTop: 4 }}
                  />
                </div>

                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#3d3d3a", marginBottom: 8 }}>Amenities del glamping</p>
                  {GLAMPING_AMENITY_CATEGORIES.map(cat => (
                    <div key={cat.id} style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#9a9690", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                        {cat.emoji} {cat.label}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {cat.names.map(name => (
                          <label
                            key={name}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              border: `1px solid ${selectedGlampingAmenities.includes(name) ? "#2d6a4f" : "#e0ddd6"}`,
                              background: selectedGlampingAmenities.includes(name) ? "#e8f5ee" : "#fff",
                              borderRadius: 999, padding: "5px 10px", fontSize: 12, cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox" checked={selectedGlampingAmenities.includes(name)}
                              onChange={() => toggleGlampingAmenity(name)}
                              style={{ display: "none" }}
                            />
                            {AMENITY_ICONS[name] ?? ""} {name}
                          </label>
                        ))}
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
          <div>
            <label style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 16px", border: "1px solid #e0ddd6", borderRadius: 12,
              cursor: "pointer",
            }}>
              <input type="checkbox" checked={acceptsCamping} onChange={() => toggle("Camping")} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>⛺ También permite acampar</span>
            </label>
            {acceptsCamping && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "14px 4px 4px" }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#3d3d3a" }}>Precio por noche (camping)</label>
                  <input
                    type="number" value={campingDetail.price}
                    onChange={e => updCamping("price", e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0ddd6", borderRadius: 10, marginTop: 4 }}
                  />
                </div>

                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#3d3d3a", marginBottom: 8 }}>Amenities del camping</p>
                  {AMENITY_CATEGORIES.map(cat => (
                    <div key={cat.id} style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#9a9690", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                        {cat.emoji} {cat.label}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {cat.names.map(name => (
                          <label
                            key={name}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              border: `1px solid ${selectedCampingAmenities.includes(name) ? "#2d6a4f" : "#e0ddd6"}`,
                              background: selectedCampingAmenities.includes(name) ? "#e8f5ee" : "#fff",
                              borderRadius: 999, padding: "5px 10px", fontSize: 12, cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox" checked={selectedCampingAmenities.includes(name)}
                              onChange={() => toggleCampingAmenity(name)}
                              style={{ display: "none" }}
                            />
                            {AMENITY_ICONS[name] ?? ""} {name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
