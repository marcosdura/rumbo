"use client"

// "🔗 Compartir" (escuelas, servicios, rutas, sectores): el mismo modal que la página del
// lugar (copiar el link o mandarlo por WhatsApp).
import { useState } from "react"
import ShareModal from "@/components/spot-detail/ShareModal"


// icon: solo el ícono (la barra de arriba de una nota del blog en el
// celular, como la del lugar).
export default function ShareButton({ name, icon = false }: { name: string; icon?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className="btn-hover"
        onClick={() => setOpen(true)}
        aria-label={icon ? "Compartir" : undefined}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: icon ? "9px 11px" : "9px 16px", borderRadius: 12,
          fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer",
          border: "1px solid var(--border)", background: "#fff", color: "#3d3d3a", flexShrink: 0,
        }}
      >
        {icon ? "🔗" : "🔗 Compartir"}
      </button>
      {open && <ShareModal name={name} onClose={() => setOpen(false)} />}
    </>
  )
}
