"use client"

import { TREKKING_FEATURES, GLAMPING_AMENITY_CATEGORIES, AMENITY_CATEGORIES } from "../constants"
import { s } from "../styles"
import SummaryCard from "../ui/SummaryCard"
import SummaryRow from "../ui/SummaryRow"
import Pill from "@/components/ui/Pill"
import type {
  Category, BasicInfo, TrekkingFeatures, RouteItem, SurfItem, KayakItem,
  ClimbingMode, SectorItem, MotorhomeDetailItem, CampingDetailItem, GlampingDetailItem,
  TrekkingMode, ClimbingRouteItem,
} from "../types"

export default function StepResumen({
  selectedCat, isService, isTrekking, basic, trekkingFeatures, routes,
  surf, kayaks, availableSpots, selectedSpotId, submitting, uploadProgress,
  error, onSubmit, onBack, onEditStep,
  climbingMode, climbingSpotName, climbingSectorName, sectors, climbingNewRoutes,
  isPublic, publicTransport, creatingNewSpot,
  images, previews, surfPhotoPreviews, kayakPhotoPreviews,
  selectedAmenities, selectedGlampingAmenities, selectedCampingAmenities,
  additionalCategories, motorhomeDetail, campingDetail, glampingUnits,
  trekkingMode, sectorRoutes,
}: {
  selectedCat: Category
  isService: boolean
  isTrekking: boolean
  basic: BasicInfo
  trekkingFeatures: TrekkingFeatures
  routes: RouteItem[]
  surf: SurfItem
  kayaks: KayakItem[]
  availableSpots: { id: number; name: string }[]
  selectedSpotId: number | null
  submitting: boolean
  uploadProgress: string | null
  error: string | null
  onSubmit: () => void
  onBack: () => void
  onEditStep: (n: number) => void
  climbingMode?: ClimbingMode
  climbingSpotName?: string
  climbingSectorName?: string
  sectors?: SectorItem[]
  climbingNewRoutes?: ClimbingRouteItem[]
  isPublic?: boolean | null
  publicTransport?: string | null
  creatingNewSpot?: boolean
  images?: File[]
  previews?: string[]
  surfPhotoPreviews?: (string | null)[]
  kayakPhotoPreviews?: (string | null)[]
  selectedAmenities?: string[]
  selectedGlampingAmenities?: string[]
  selectedCampingAmenities?: string[]
  additionalCategories?: string[]
  motorhomeDetail?: MotorhomeDetailItem
  campingDetail?: CampingDetailItem
  glampingUnits?: GlampingDetailItem[]
  trekkingMode?: TrekkingMode
  sectorRoutes?: ClimbingRouteItem[]
}) {
  const isCamping = selectedCat.name === "Camping"
  const isGlamping = selectedCat.name === "Glamping"
  const isMotorhome = selectedCat.name === "Motorhome"
  const isEscalada = selectedCat.name === "Escalada"
  const showBasicInfoCard = !isService || creatingNewSpot

  const seasonLabel = basic.season_type === "seasonal"
    ? `Estacional (${basic.season_start || "?"} a ${basic.season_end || "?"})`
    : "Todo el año"

  return (
    <div>
      <h2 style={s.title}>Revisá tu lugar</h2>

      <SummaryCard title="Información general" onEdit={() => onEditStep(2)}>
        {isService && !creatingNewSpot ? (
          <>
            <SummaryRow label="Categoría" value={selectedCat.label} />
            <SummaryRow
              label="Lugar"
              value={availableSpots.find(sp => sp.id === selectedSpotId)?.name}
            />
            {selectedCat.name === "Surf" && surf.name && (
              <SummaryRow label="Escuela" value={surf.name} />
            )}
            {selectedCat.name === "Kayak" && kayaks[0]?.name && (
              <SummaryRow label="Servicio" value={kayaks[0].name} />
            )}
          </>
        ) : (
          <>
            <SummaryRow label="Nombre" value={basic.name} />
            <SummaryRow label="Categoría" value={selectedCat.label} />
            <SummaryRow label="Departamento" value={basic.department} />
          </>
        )}
      </SummaryCard>

      {showBasicInfoCard && basic.description && (
        <SummaryCard title="Descripción" onEdit={() => onEditStep(2)}>
          <p style={{ fontSize: 14, color: "#3d3d3a", margin: 0, lineHeight: 1.6 }}>
            {basic.description.length > 120
              ? basic.description.slice(0, 120) + "…"
              : basic.description}
          </p>
        </SummaryCard>
      )}

      {showBasicInfoCard && (
        <SummaryCard title="Precio y temporada" onEdit={() => onEditStep(2)}>
          <SummaryRow label="Precio" value={basic.price ? `$${basic.price}` : "Gratis"} />
          <SummaryRow label="Temporada" value={seasonLabel} />
        </SummaryCard>
      )}

      {showBasicInfoCard && (isPublic !== null && isPublic !== undefined) && (
        <SummaryCard title="Acceso" onEdit={() => onEditStep(2)}>
          <SummaryRow label="Tipo de acceso" value={isPublic ? "Público" : "Privado"} />
          {publicTransport && (
            <SummaryRow
              label="Transporte público"
              value={publicTransport === "si" ? "Accesible" : publicTransport === "no" ? "No accesible" : "No sabe"}
            />
          )}
        </SummaryCard>
      )}

      {showBasicInfoCard && (basic.lat || basic.lng) && (
        <SummaryCard title="Ubicación" onEdit={() => onEditStep(2)}>
          <SummaryRow label="Latitud" value={basic.lat} />
          <SummaryRow label="Longitud" value={basic.lng} />
        </SummaryCard>
      )}

      {showBasicInfoCard && (basic.email || basic.whatsapp || basic.instagram) && (
        <SummaryCard title="Contacto" onEdit={() => onEditStep(2)}>
          {basic.email     && <SummaryRow label="Email"     value={basic.email} />}
          {basic.whatsapp  && <SummaryRow label="WhatsApp"  value={basic.whatsapp} />}
          {basic.instagram && <SummaryRow label="Instagram" value={basic.instagram} />}
        </SummaryCard>
      )}

      {images && images.length > 0 && previews && previews.length > 0 && (
        <SummaryCard title="Imágenes" onEdit={() => onEditStep(isTrekking ? 5 : 4)}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {previews.map((src, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img
                  src={src}
                  alt={`Imagen ${i + 1}`}
                  style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }}
                />
                {i === 0 && (
                  <span style={{
                    position: "absolute", bottom: 4, left: 4,
                    background: "var(--primary)", color: "#fff", fontSize: 10, fontWeight: 600,
                    padding: "2px 6px", borderRadius: 999,
                  }}>
                    Principal
                  </span>
                )}
              </div>
            ))}
          </div>
        </SummaryCard>
      )}

      {(isCamping || isGlamping) && selectedAmenities && selectedAmenities.length > 0 && (
        <SummaryCard title={`Amenities del ${isCamping ? "camping" : "glamping"}`} onEdit={() => onEditStep(3)}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {selectedAmenities.map(name => (
              <Pill key={name} variant="subtle-green" hover>{name}</Pill>
            ))}
          </div>
        </SummaryCard>
      )}

      {isCamping && campingDetail?.price && (
        <SummaryCard title="Datos del camping" onEdit={() => onEditStep(2)}>
          <SummaryRow label="Precio por noche" value={`$${campingDetail.price}`} />
        </SummaryCard>
      )}

      {isGlamping && glampingUnits && glampingUnits.length > 0 && (
        <SummaryCard title="Tipos de alojamiento" onEdit={() => onEditStep(3)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {glampingUnits.map((unit, i) => (
              <div key={i} style={{ fontSize: 13, color: "#3d3d3a" }}>
                <strong>{unit.accommodation_type || `Tipo ${i + 1}`}</strong>
                {" — "}
                {[unit.capacity && `${unit.capacity} pers.`, unit.price_per_night && `$${unit.price_per_night}/noche`, unit.min_nights && `mín. ${unit.min_nights} noches`]
                  .filter(Boolean).join(" · ")}
              </div>
            ))}
          </div>
        </SummaryCard>
      )}

      {isMotorhome && motorhomeDetail && (
        <SummaryCard title="Datos del área de motorhomes" onEdit={() => onEditStep(3)}>
          {motorhomeDetail.capacity && <SummaryRow label="Capacidad" value={`${motorhomeDetail.capacity} motorhome(s)`} />}
          {motorhomeDetail.surface_type && <SummaryRow label="Superficie" value={motorhomeDetail.surface_type} />}
          <SummaryRow label="Agua" value={motorhomeDetail.has_water ? "Sí" : "No"} />
          <SummaryRow label="Electricidad" value={motorhomeDetail.has_electricity ? "Sí" : "No"} />
          <SummaryRow label="Dump station" value={motorhomeDetail.has_dump_station ? "Sí" : "No"} />
          {motorhomeDetail.max_stay_nights && <SummaryRow label="Noches máximas" value={motorhomeDetail.max_stay_nights} />}
        </SummaryCard>
      )}

      {additionalCategories && additionalCategories.length > 0 && (
        <SummaryCard title="Categorías adicionales" onEdit={() => onEditStep(5)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {additionalCategories.includes("Motorhome") && motorhomeDetail && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", margin: "0 0 6px" }}>🚐 Motorhome</p>
                {motorhomeDetail.capacity && <SummaryRow label="Capacidad" value={`${motorhomeDetail.capacity} motorhome(s)`} />}
                {motorhomeDetail.surface_type && <SummaryRow label="Superficie" value={motorhomeDetail.surface_type} />}
              </div>
            )}
            {additionalCategories.includes("Glamping") && glampingUnits && glampingUnits.length > 0 && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", margin: "0 0 6px" }}>🛖 Glamping</p>
                {glampingUnits.map((unit, i) => (
                  <p key={i} style={{ fontSize: 13, color: "#3d3d3a", margin: "0 0 4px" }}>
                    {unit.accommodation_type || `Tipo ${i + 1}`} — {[unit.capacity && `${unit.capacity} pers.`, unit.price_per_night && `$${unit.price_per_night}/noche`].filter(Boolean).join(" · ")}
                  </p>
                ))}
                {selectedGlampingAmenities && selectedGlampingAmenities.length > 0 && (
                  <p style={{ fontSize: 12, color: "#7a7669", margin: 0 }}>
                    Amenities: {selectedGlampingAmenities.join(", ")}
                  </p>
                )}
              </div>
            )}
            {additionalCategories.includes("Camping") && campingDetail?.price && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", margin: "0 0 6px" }}>⛺ Camping</p>
                <SummaryRow label="Precio por noche" value={`$${campingDetail.price}`} />
                {selectedCampingAmenities && selectedCampingAmenities.length > 0 && (
                  <p style={{ fontSize: 12, color: "#7a7669", margin: "4px 0 0" }}>
                    Amenities: {selectedCampingAmenities.join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        </SummaryCard>
      )}

      {selectedCat.name === "Trekking" && (
        <SummaryCard title="Características del lugar" onEdit={() => onEditStep(3)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {TREKKING_FEATURES.map(({ key, label, emoji }) => {
              const val = trekkingFeatures[key]
              if (val === null) return null
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#3d3d3a" }}>{emoji} {label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: val ? "var(--primary)" : "var(--danger)" }}>
                    {val ? "✓ Sí" : "✗ No"}
                  </span>
                </div>
              )
            })}
          </div>
        </SummaryCard>
      )}

      {selectedCat.name === "Trekking" && routes.filter(r => r.name).length > 0 && (
        <SummaryCard title="Rutas" onEdit={() => onEditStep(trekkingMode === "new_route" ? 3 : 4)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {routes.filter(r => r.name).map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#1b1b19", margin: 0 }}>{r.name}</p>
                <p style={{ fontSize: 12, color: "#7a7669", margin: 0, textAlign: "right", flexShrink: 0 }}>
                  {[r.distance_km && `${r.distance_km} km`, r.difficulty].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </SummaryCard>
      )}

      {isEscalada && (!climbingMode || climbingMode === "new_spot") && sectors && sectors.filter(sec => sec.name).length > 0 && (
        <SummaryCard title="Sectores" onEdit={() => onEditStep(3)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sectors.filter(sec => sec.name).map((sec, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#1b1b19", margin: 0 }}>{sec.name}</p>
                <p style={{ fontSize: 12, color: "#7a7669", margin: 0, textAlign: "right", flexShrink: 0 }}>
                  {[sec.type, sec.max_altitude && `${sec.max_altitude} m`].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </SummaryCard>
      )}

      {isEscalada && climbingMode !== "new_route" && sectorRoutes && sectorRoutes.filter(r => r.name).length > 0 && (
        <SummaryCard title="Rutas de escalada" onEdit={() => onEditStep(4)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sectorRoutes.filter(r => r.name).map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#1b1b19", margin: 0 }}>{r.name}</p>
                <p style={{ fontSize: 12, color: "#7a7669", margin: 0, textAlign: "right", flexShrink: 0 }}>
                  {sectors?.[r.sectorIndex]?.name || "Sector sin nombre"}
                  {r.grade && ` · ${r.grade}`}
                </p>
              </div>
            ))}
          </div>
        </SummaryCard>
      )}

      {(climbingMode === "new_sector" || climbingMode === "new_route") && (
        <SummaryCard
          title={climbingMode === "new_sector" ? "Nuevo sector" : "Nueva ruta"}
          onEdit={() => onEditStep(2)}
        >
          {climbingSpotName && <SummaryRow label="Spot" value={climbingSpotName} />}
          {climbingMode === "new_sector" && sectors?.[0] && (
            <>
              <SummaryRow label="Sector" value={sectors[0].name} />
              {sectors[0].type && <SummaryRow label="Tipo" value={sectors[0].type} />}
              {sectors[0].restrictions && <SummaryRow label="Restricciones" value={sectors[0].restrictions} />}
            </>
          )}
          {climbingMode === "new_route" && (
            <>
              {climbingSectorName && <SummaryRow label="Sector" value={climbingSectorName} />}
              {climbingNewRoutes && climbingNewRoutes.filter(r => r.name).length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                  {climbingNewRoutes.filter(r => r.name).map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#1b1b19", margin: 0 }}>{r.name}</p>
                      <p style={{ fontSize: 12, color: "#7a7669", margin: 0, textAlign: "right", flexShrink: 0 }}>
                        {[r.grade, r.type].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </SummaryCard>
      )}

      {selectedCat.name === "Surf" && surf.name && (
        <SummaryCard title="Datos de la escuela de surf" onEdit={() => onEditStep(isService ? (creatingNewSpot ? 4 : 3) : 3)}>
          <SummaryRow label="Nombre" value={surf.name} />
          {surf.class_type && <SummaryRow label="Tipo de clase" value={surf.class_type} />}
          {surf.duration && <SummaryRow label="Duración" value={`${surf.duration} hs`} />}
          <SummaryRow
            label="Temporada"
            value={surf.season_type === "seasonal" ? `Estacional (${surf.season_start || "?"} a ${surf.season_end || "?"})` : "Todo el año"}
          />
          <SummaryRow label="Equipo incluido" value={surf.equipment_include ? "Sí" : "No"} />
          {surf.email && <SummaryRow label="Email" value={surf.email} />}
          {surf.whatsapp && <SummaryRow label="WhatsApp" value={surf.whatsapp} />}
          {surf.instagram && <SummaryRow label="Instagram" value={surf.instagram} />}
          {surfPhotoPreviews && surfPhotoPreviews.some(p => p) && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {surfPhotoPreviews.filter(Boolean).map((src, i) => (
                <img key={i} src={src!} alt={`Foto ${i + 1}`} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
              ))}
            </div>
          )}
        </SummaryCard>
      )}

      {selectedCat.name === "Kayak" && kayaks.filter(k => k.name).length > 0 && (
        <SummaryCard title="Datos del servicio de kayak" onEdit={() => onEditStep(isService ? (creatingNewSpot ? 4 : 3) : 3)}>
          {kayaks.filter(k => k.name).map((k, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <SummaryRow label="Nombre" value={k.name} />
              {k.water_type && <SummaryRow label="Tipo de agua" value={k.water_type} />}
              {k.difficulty && <SummaryRow label="Dificultad" value={k.difficulty} />}
              {k.duration && <SummaryRow label="Duración" value={`${k.duration} hs`} />}
              {k.kayak_type && <SummaryRow label="Tipo de kayak" value={k.kayak_type} />}
              <SummaryRow
                label="Temporada"
                value={k.season_type === "seasonal" ? `Estacional (${k.season_start || "?"} a ${k.season_end || "?"})` : "Todo el año"}
              />
              <SummaryRow label="Alquiler disponible" value={k.rental_available ? "Sí" : "No"} />
              {k.email && <SummaryRow label="Email" value={k.email} />}
              {k.whatsapp && <SummaryRow label="WhatsApp" value={k.whatsapp} />}
              {k.instagram && <SummaryRow label="Instagram" value={k.instagram} />}
            </div>
          ))}
          {kayakPhotoPreviews && kayakPhotoPreviews.some(p => p) && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {kayakPhotoPreviews.filter(Boolean).map((src, i) => (
                <img key={i} src={src!} alt={`Foto ${i + 1}`} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
              ))}
            </div>
          )}
        </SummaryCard>
      )}

      <div style={s.navRow}>
        <button style={s.btnSecondary} onClick={onBack}>Volver</button>
        <button
          style={{ ...s.btnPrimary, opacity: submitting ? 0.7 : 1 }}
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? (uploadProgress ?? "Enviando...") : "Confirmar y enviar"}
        </button>
      </div>
      {error && <p style={s.errorText}>{error}</p>}
    </div>
  )
}
