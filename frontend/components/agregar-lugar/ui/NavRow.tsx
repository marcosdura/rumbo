"use client"

import { s } from "../styles"

export default function NavRow({
  onBack, onNext, error, stepLabel,
}: {
  onBack?: () => void
  onNext?: () => void
  error?: string | null
  stepLabel?: string
}) {
  return (
    <>
      <div style={s.navRow}>
        {onBack ? <button style={s.btnSecondary} onClick={onBack}>Atrás</button> : <div />}
        {stepLabel && (
          <span style={{ fontSize: 12, color: "#7a7669", fontFamily: "'DM Sans', sans-serif" }}>
            {stepLabel}
          </span>
        )}
        {onNext && <button style={s.btnPrimary} onClick={onNext}>Siguiente</button>}
      </div>
      {error && <p style={s.errorText}>{error}</p>}
    </>
  )
}
