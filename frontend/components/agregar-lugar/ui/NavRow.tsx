"use client"

import { s } from "../styles"

export default function NavRow({
  onBack, onNext, error,
}: {
  onBack?: () => void
  onNext?: () => void
  error?: string | null
}) {
  return (
    <>
      <div style={s.navRow}>
        {onBack ? <button style={s.btnSecondary} onClick={onBack}>Atrás</button> : <div />}
        {onNext && <button style={s.btnPrimary} onClick={onNext}>Siguiente</button>}
      </div>
      {error && <p style={s.errorText}>{error}</p>}
    </>
  )
}
