"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { s } from "./styles"

interface Props {
  onDeleteRequest: () => void
}

export default function AccountActions({ onDeleteRequest }: Props) {
  const [showDangerZone, setShowDangerZone] = useState(false)

  return (
    <div className="fade-up fade-up-3" style={{ ...s.card, padding: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          className="action-btn-danger"
          style={{ ...s.actionBtn, color: "#dc2626", border: "1px solid #f5c0c0", background: "#fdf0f0" }}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <div style={{ ...s.actionBtnIcon, background: "#fdf0f0", border: "1px solid #f5c0c0" }}>↩</div>
          Cerrar sesión
        </button>

        {/* Zona peligrosa — desplegable */}
        <div style={{ borderTop: "1px solid #ede9e1", marginTop: 4, paddingTop: 6 }}>
          <button
            style={{ ...s.actionBtn, color: "#9a9690", background: "transparent", border: "none", padding: "8px 6px", fontSize: 12, gap: 6 }}
            onClick={() => setShowDangerZone(v => !v)}
          >
            <span style={{ fontSize: 10, transition: "transform 0.2s", display: "inline-block", transform: showDangerZone ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
            Zona peligrosa
          </button>

          {showDangerZone && (
            <button
              className="action-btn-danger"
              style={{ ...s.actionBtn, color: "#9a1c1c", border: "1px solid #f5c0c0", background: "#fdf0f0", marginTop: 4 }}
              onClick={onDeleteRequest}
            >
              <div style={{ ...s.actionBtnIcon, background: "#fdf0f0", border: "1px solid #f5c0c0", fontSize: 13 }}>🗑</div>
              Eliminar cuenta
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
