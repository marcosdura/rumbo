"use client"

import { TREKKING_FEATURES } from "../constants"
import { s } from "../styles"
import SummaryCard from "../ui/SummaryCard"
import SummaryRow from "../ui/SummaryRow"
import type { Category, BasicInfo, TrekkingFeatures, RouteItem, SurfItem, KayakItem } from "../types"

export default function StepResumen({
  selectedCat, isService, isTrekking, basic, trekkingFeatures, routes,
  surf, kayaks, availableSpots, selectedSpotId, submitting, uploadProgress,
  error, onSubmit, onBack, onEditStep,
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
}) {
  return (
    <div>
      <h2 style={s.title}>Revisá tu lugar</h2>

      <SummaryCard title="Información general" onEdit={() => onEditStep(2)}>
        {isService ? (
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

      {!isService && basic.description && (
        <SummaryCard title="Descripción" onEdit={() => onEditStep(2)}>
          <p style={{ fontSize: 14, color: "#3d3d3a", margin: 0, lineHeight: 1.6 }}>
            {basic.description.length > 120
              ? basic.description.slice(0, 120) + "…"
              : basic.description}
          </p>
        </SummaryCard>
      )}

      {!isService && (basic.lat || basic.lng) && (
        <SummaryCard title="Ubicación" onEdit={() => onEditStep(2)}>
          <SummaryRow label="Latitud" value={basic.lat} />
          <SummaryRow label="Longitud" value={basic.lng} />
        </SummaryCard>
      )}

      {!isService && (basic.email || basic.whatsapp || basic.instagram) && (
        <SummaryCard title="Contacto" onEdit={() => onEditStep(2)}>
          {basic.email     && <SummaryRow label="Email"     value={basic.email} />}
          {basic.whatsapp  && <SummaryRow label="WhatsApp"  value={basic.whatsapp} />}
          {basic.instagram && <SummaryRow label="Instagram" value={basic.instagram} />}
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
                  <span style={{ fontSize: 13, fontWeight: 700, color: val ? "#2d6a4f" : "#dc2626" }}>
                    {val ? "✓ Sí" : "✗ No"}
                  </span>
                </div>
              )
            })}
          </div>
        </SummaryCard>
      )}

      {selectedCat.name === "Trekking" && routes.filter(r => r.name).length > 0 && (
        <SummaryCard title="Rutas" onEdit={() => onEditStep(3)}>
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
