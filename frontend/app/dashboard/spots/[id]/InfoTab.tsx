"use client"

import { s, MONTHS } from "./styles"

interface Props {
  editName: string; setEditName: (v: string) => void
  editDescription: string; setEditDescription: (v: string) => void
  editEmail: string; setEditEmail: (v: string) => void
  editWhatsapp: string; setEditWhatsapp: (v: string) => void
  editInstagram: string; setEditInstagram: (v: string) => void
  editPrice: string; setEditPrice: (v: string) => void
  editSeasonType: "all_year" | "seasonal"; setEditSeasonType: (v: "all_year" | "seasonal") => void
  editSeasonStart: string; setEditSeasonStart: (v: string) => void
  editSeasonEnd: string; setEditSeasonEnd: (v: string) => void
  editIsPublic: boolean | null; setEditIsPublic: (v: boolean) => void
  editPublicTransport: string | null; setEditPublicTransport: (updater: (prev: string | null) => string | null) => void
  saving: boolean
  saveOk: boolean
  saveError: string | null
  onSave: () => void
}

export default function InfoTab({
  editName, setEditName, editDescription, setEditDescription,
  editEmail, setEditEmail, editWhatsapp, setEditWhatsapp, editInstagram, setEditInstagram,
  editPrice, setEditPrice, editSeasonType, setEditSeasonType, editSeasonStart, setEditSeasonStart,
  editSeasonEnd, setEditSeasonEnd, editIsPublic, setEditIsPublic, editPublicTransport, setEditPublicTransport,
  saving, saveOk, saveError, onSave,
}: Props) {
  return (
    <div style={{ ...s.card, padding: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        <div>
          <label style={s.label}>Nombre</label>
          <input value={editName} onChange={e => setEditName(e.target.value)} style={s.input} />
        </div>

        <div>
          <label style={s.label}>Descripción</label>
          <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={5} style={{ ...s.input, resize: "vertical" }} />
        </div>

        {/* Separador */}
        <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2d6a4f", margin: "0 0 12px" }}>Contacto</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={s.label}>Email</label>
              <input value={editEmail} onChange={e => setEditEmail(e.target.value)} style={s.input} type="email" placeholder="email@ejemplo.com" />
            </div>
            <div>
              <label style={s.label}>WhatsApp</label>
              <input value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} style={s.input} placeholder="+598 99 000 000" />
            </div>
            <div>
              <label style={s.label}>Instagram</label>
              <input value={editInstagram} onChange={e => setEditInstagram(e.target.value)} style={s.input} placeholder="@usuario" />
            </div>
          </div>
        </div>

        {/* Precio y temporada */}
        <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2d6a4f", margin: "0 0 12px" }}>Precio y temporada</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={s.label}>Precio (UYU) — poné 0 si es gratis</label>
              <input value={editPrice} onChange={e => setEditPrice(e.target.value)} style={s.input} type="number" min={0} placeholder="0" />
            </div>
            <div>
              <label style={s.label}>Temporada</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {([
                  { value: "all_year", label: "🗓️ Todo el año" },
                  { value: "seasonal", label: "📅 Temporada específica" },
                ] as { value: "all_year" | "seasonal"; label: string }[]).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setEditSeasonType(opt.value)} style={s.pill(editSeasonType === opt.value)}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {editSeasonType === "seasonal" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={s.label}>Desde</label>
                    <select value={editSeasonStart} onChange={e => setEditSeasonStart(e.target.value)} style={s.input}>
                      <option value="">Mes...</option>
                      {MONTHS.map((m, i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Hasta</label>
                    <select value={editSeasonEnd} onChange={e => setEditSeasonEnd(e.target.value)} style={s.input}>
                      <option value="">Mes...</option>
                      {MONTHS.map((m, i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Acceso */}
        <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2d6a4f", margin: "0 0 12px" }}>Acceso</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={s.label}>¿El lugar es público o privado?</label>
              <div style={{ display: "flex", gap: 8 }}>
                {([
                  { value: true, label: "🏛️ Público" },
                  { value: false, label: "🔒 Privado" },
                ] as { value: boolean; label: string }[]).map(opt => (
                  <button key={String(opt.value)} type="button" onClick={() => setEditIsPublic(opt.value)} style={s.pill(editIsPublic === opt.value)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={s.label}>¿Accesible en transporte público?</label>
              <div style={{ display: "flex", gap: 8 }}>
                {([
                  { value: "si", label: "✅ Sí" },
                  { value: "no", label: "❌ No" },
                  { value: "nose", label: "🤷 No sé" },
                ] as { value: string; label: string }[]).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setEditPublicTransport(prev => prev === opt.value ? null : opt.value)} style={s.pill(editPublicTransport === opt.value)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Guardar */}
        <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onSave}
            disabled={saving}
            style={{ padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#2d6a4f", color: "#fff", border: "none", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          {saveOk && <span style={{ fontSize: 13, color: "#2d6a4f", fontWeight: 600 }}>✓ Guardado correctamente</span>}
          {saveError && <span style={{ fontSize: 13, color: "#dc2626" }}>{saveError}</span>}
        </div>

      </div>
    </div>
  )
}
