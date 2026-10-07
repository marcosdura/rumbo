"use client"

import Image from "next/image"

interface Props {
  // "Paso 2 de 5" (vacío si no aplica).
  stepLabel: string
  // "Empezar de cero" se ofrece una vez pasado el primer paso.
  canReset: boolean
  // Texto de arriba; con link directo dice qué se está sumando y dónde.
  intro?: string
  onReset: () => void
}

const DEFAULT_INTRO = "Completá este formulario para agregar tu lugar a la plataforma. Revisaremos la información antes de publicarlo."

export default function AgregarLugarHeader({ stepLabel, canReset, intro = DEFAULT_INTRO, onReset }: Props) {
  return (
    <div style={{
      background: "linear-gradient(160deg, var(--primary-dark) 0%, var(--primary) 65%, #40916c 100%)",
      borderRadius: 20,
      padding: "24px 28px",
      marginBottom: 28,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>

        {canReset && (
          <button
            type="button"
            onClick={onReset}
            style={{ background: "none", border: "none", fontSize: 13, color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", padding: 0 }}
          >
            Empezar de cero
          </button>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, justifyContent: "center" }}>
        <Image src="/RumboLogo.png" alt="Rumbo" width={36} height={36} style={{ objectFit: "contain", borderRadius: 8 }} />
        <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "var(--font-nunito)" }}>rumbo</span>
      </div>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", maxWidth: 480, margin: "0 auto", lineHeight: 1.5, textAlign: "center" }}>
        {intro}
      </p>
      {stepLabel && (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 12, textAlign: "center", marginBottom: 0 }}>
          {stepLabel}
        </p>
      )}
    </div>
  )
}
