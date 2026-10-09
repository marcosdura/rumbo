"use client"

// "🔗 Compartir" en escuelas y servicios: el mismo modal que la página del
// lugar (copiar el link o mandarlo por WhatsApp).
import { useState } from "react"
import ShareModal from "@/components/spot-detail/ShareModal"

const Modal = ShareModal as unknown as (props: { name: string; onClose: () => void }) => React.ReactElement

export default function ShareButton({ name }: { name: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12,
          fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer",
          border: "1px solid var(--border)", background: "#fff", color: "#3d3d3a", flexShrink: 0,
        }}
      >
        🔗 Compartir
      </button>
      {open && <Modal name={name} onClose={() => setOpen(false)} />}
    </>
  )
}
