"use client"

import Pill from "@/components/ui/Pill"
import { KIND_LABELS, itemDetails, itemPhotos, type AdminContribution } from "@/lib/contributions"

interface Props {
  contributions: AdminContribution[]
  loadError: string | null
  loading: boolean
  actionLoading: number | null
  actionErrors: Record<number, string>
  onApprove: (id: number) => void
  onRejectRequest: (id: number) => void
}

// Aportes pendientes: cosas nuevas sumadas a un lugar aprobado. Mismas
// filas y botones que los pedidos de cambio de ChangesTab.
export default function ContributionsList({ contributions, loadError, loading, actionLoading, actionErrors, onApprove, onRejectRequest }: Props) {
  return (
    <div style={{ marginTop: 28 }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--primary)", margin: "0 0 6px" }}>
        Aportes nuevos
      </p>
      <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 16, lineHeight: 1.5 }}>
        Experiencias, alojamientos, rutas, sectores, vías, surf y kayak sumados a lugares ya aprobados.
        Cada uno se aprueba o rechaza por separado; al rechazar se borra (y sus fotos).
      </p>

      {loadError ? (
        <p style={{ color: "var(--danger)", fontSize: 14 }}>{loadError}</p>
      ) : loading ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</p>
      ) : contributions.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>No hay aportes pendientes.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {contributions.map(c => {
            const busy = actionLoading === c.id
            const details = itemDetails(c.kind, c.item)
            const photos = itemPhotos(c.item)
            const routes = c.item?.routes ?? []
            const ownSpot = c.spot.owner_email === c.author_email
            return (
              <div key={c.id} className="spot-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>{c.title}</span>
                      <Pill variant="orange" size="sm">{KIND_LABELS[c.kind]}</Pill>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted-strong)", margin: 0 }}>
                      en {c.spot.name}{c.sector_name ? ` · sector ${c.sector_name}` : ""} · {c.spot.category?.name} · {c.spot.department}
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                      <a href={`mailto:${c.author_email}`} style={{ fontSize: 11, color: "var(--primary)", textDecoration: "none" }}>
                        ✉️ {c.author_email}
                      </a>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{ownSpot ? "dueño del lugar" : "no es el dueño del lugar"}</span>
                      {c.created_at && (
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                          Pedido el {new Date(c.created_at).toLocaleDateString("es-UY")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button onClick={() => onApprove(c.id)} disabled={busy}
                      className="action-btn-sm" style={{ background: "var(--primary)", color: "#fff", border: "none", opacity: busy ? 0.6 : 1 }}>
                      {busy ? "Procesando..." : "Aprobar"}
                    </button>
                    <a href={`/spots/${c.spot.slug ?? c.spot.id}`} target="_blank" rel="noopener noreferrer"
                      className="action-btn-sm" style={{ background: "#fff", color: "#3d3d3a", border: "1px solid var(--border)", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                      Ver lugar
                    </a>
                    <button onClick={() => onRejectRequest(c.id)} disabled={busy}
                      className="action-btn-sm" style={{ background: "#fff", color: "var(--danger)", border: "1px solid #fecaca", opacity: busy ? 0.6 : 1 }}>
                      Rechazar
                    </button>
                  </div>
                </div>

                {actionErrors[c.id] && (
                  <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{actionErrors[c.id]}</p>
                )}

                {(details.length > 0 || photos.length > 0 || routes.length > 0) && (
                  <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                    {details.length > 0 && (
                      <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "4px 14px", margin: 0, fontSize: 13 }}>
                        {details.map(([label, value]) => (
                          <div key={label} style={{ display: "contents" }}>
                            <dt style={{ color: "var(--muted)" }}>{label}</dt>
                            <dd style={{ margin: 0, color: "#1b1b19", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {routes.length > 0 && (
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#7a7669", margin: "0 0 4px" }}>Vías del sector ({routes.length})</p>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#1b1b19" }}>
                          {routes.map((r, i) => (
                            <li key={i}>{String(r.name)}{r.grade ? ` · ${String(r.grade)}` : ""}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {photos.length > 0 && (
                      <div className="photo-grid" style={{ marginTop: 0 }}>
                        {photos.map(url => (
                          <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="photo-card" style={{ display: "block" }}>
                            <img src={url} alt="" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
