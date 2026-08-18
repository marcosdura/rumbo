"use client"

interface EditingSpot { id: number; name: string; description: string }

interface Props {
  editingSpot: EditingSpot | null
  setEditingSpot: (updater: (prev: EditingSpot | null) => EditingSpot | null) => void
  onCancel: () => void
  onSave: () => Promise<void>
}

export default function EditSpotModal({ editingSpot, setEditingSpot, onCancel, onSave }: Props) {
  if (editingSpot === null) return null
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "28px 32px", maxWidth: 480, width: "90%", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: "#1b1b19", marginBottom: 20 }}>Editar spot</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#7a7669", marginBottom: 4 }}>Nombre</p>
            <input
              value={editingSpot.name}
              onChange={e => setEditingSpot(prev => prev ? { ...prev, name: e.target.value } : null)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e0ddd6", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#7a7669", marginBottom: 4 }}>Descripción</p>
            <textarea
              value={editingSpot.description}
              onChange={e => setEditingSpot(prev => prev ? { ...prev, description: e.target.value } : null)}
              rows={4}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e0ddd6", fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #e0ddd6", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#2d6a4f", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
