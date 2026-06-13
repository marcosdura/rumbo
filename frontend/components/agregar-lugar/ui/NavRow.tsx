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
  const buttons = (
    <div style={s.navRow}>
      {onBack ? <button style={s.btnSecondary} onClick={onBack}>Atrás</button> : <div />}
      {stepLabel && (
        <span style={{ fontSize: 12, color: "#9a9690", fontFamily: "inherit" }}>{stepLabel}</span>
      )}
      {onNext && <button style={s.btnPrimary} onClick={onNext}>Siguiente</button>}
    </div>
  )

  return (
    <>
      {buttons}
      {error && <p style={s.errorText}>{error}</p>}
      <div style={{ marginTop: 32 }} />
      {buttons}
    </>
  )
}
