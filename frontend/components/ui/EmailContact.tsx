"use client"

// Un email de contacto: tocarlo abre el correo, y "Copiar" queda al lado
// (sin app de correo configurada, mailto no hace nada). Lo usan la página
// del lugar y la de escuelas y servicios.
import { useState } from "react"

export default function EmailContact({ email, linkClassName }: { email: string; linkClassName: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <a href={`mailto:${email}`} className={linkClassName}>{email}</a>
      <button
        type="button"
        onClick={copy}
        style={{
          fontSize: 12, color: "var(--muted)", background: "none", border: "1px solid var(--border)",
          borderRadius: 8, padding: "2px 8px", cursor: "pointer", flexShrink: 0, fontFamily: "inherit",
        }}
      >
        {copied ? "¡Copiado! ✓" : "Copiar"}
      </button>
    </span>
  )
}
