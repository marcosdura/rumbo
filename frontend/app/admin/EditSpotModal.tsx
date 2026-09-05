"use client"

import { label as labelStyle, input as inputStyle } from "@/lib/theme"
import { useModalA11y } from "@/lib/useModalA11y"

interface EditingSpot { id: number; name: string; description: string }

interface Props {
  editingSpot: EditingSpot | null
  setEditingSpot: (updater: (prev: EditingSpot | null) => EditingSpot | null) => void
  onCancel: () => void
  onSave: () => Promise<void>
}

// Modal de formulario — no puede usar ConfirmModal (ese es para confirmar,
// no para editar), pero sí el mismo lenguaje visual: overlay 0.45, card
// #f5f4f0 con borde, título en Playfair, botones a la derecha, cierra al
// clickear afuera.
export default function EditSpotModal({ editingSpot, setEditingSpot, onCancel, onSave }: Props) {
  const panelRef = useModalA11y(editingSpot !== null, onCancel)

  if (editingSpot === null) return null

  return (
    <div className="edit-modal-overlay" onClick={onCancel}>
      <style>{`
        .edit-modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .edit-modal {
          background: #f5f4f0; border: 1px solid var(--border); border-radius: 20px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.18);
          padding: 26px; width: 100%; max-width: 480px;
          font-family: var(--font-dm-sans), sans-serif;
        }
        .edit-modal-cancel-btn {
          padding: 11px 20px; border-radius: 12px;
          border: 1px solid var(--border); background: #fff;
          font-family: var(--font-dm-sans), sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; color: #3d3d3a;
          transition: background 0.15s;
        }
        .edit-modal-cancel-btn:hover { background: #f7f5f0; }
        .edit-modal-save-btn {
          padding: 11px 20px; border-radius: 12px; border: none;
          font-family: var(--font-dm-sans), sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; background: var(--primary); color: #fff;
          transition: opacity 0.15s;
        }
      `}</style>

      <div
        ref={panelRef}
        className="edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-spot-modal-title"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <h2 id="edit-spot-modal-title" style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 20, fontWeight: 600, color: "#1b1b19", margin: "0 0 18px" }}>
          Editar spot
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input
              value={editingSpot.name}
              onChange={e => setEditingSpot(prev => prev ? { ...prev, name: e.target.value } : null)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Descripción</label>
            <textarea
              value={editingSpot.description}
              onChange={e => setEditingSpot(prev => prev ? { ...prev, description: e.target.value } : null)}
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button className="edit-modal-cancel-btn" onClick={onCancel}>Cancelar</button>
          <button className="edit-modal-save-btn" onClick={onSave}>Guardar</button>
        </div>
      </div>
    </div>
  )
}
