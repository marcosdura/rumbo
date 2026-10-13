// "La escuela" / "El servicio" en la página de una escuela de surf o un
// servicio de kayak: lo propio de cada uno (dónde opera, clases, niveles...).
// El precio, la temporada, el contacto y las fotos son los del lugar.
import Pill from "@/components/ui/Pill"
import { kayakRows, surfRows, type ServiceSpot } from "@/lib/serviceDetail"

export default function ServiceSection({ spot }: { spot: ServiceSpot }) {
  const rows = spot.surf_detail ? surfRows(spot.surf_detail)
    : spot.kayak_service_detail ? kayakRows(spot.kayak_service_detail)
    : []
  if (rows.length === 0) return null

  return (
    <div className="amenities-card">
      <div className="amenities-label">
        <div className="amenities-dot" />
        <p className="amenities-title">{spot.surf_detail ? "La escuela" : "El servicio"}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map(r => (
          <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--muted-strong)" }}>{r.label}</span>
            {r.pill
              ? <Pill variant={r.pill}>{r.value}</Pill>
              : <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19", textAlign: "right" }}>{r.value}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
