import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import StepMotorhomeDetalle from "./StepMotorhomeDetalle"
import { defaultMotorhomeDetail } from "../constants"

describe("Datos del espacio para motorhomes", () => {
  it("las preguntas obligatorias dicen (obligatorio), como el resto del formulario (antes un *)", () => {
    const { container } = render(
      <StepMotorhomeDetalle motorhomeDetail={defaultMotorhomeDetail()} setMotorhomeDetail={() => {}} error={null} onBack={() => {}} onNext={() => {}} />,
    )
    for (const q of ["¿Tiene agua?", "¿Tiene electricidad?", "¿Tiene dump station?"]) {
      expect(screen.getByText(q, { exact: false }).textContent).toBe(`${q} (obligatorio)`)
    }
    expect([...container.querySelectorAll("span")].some(s => s.textContent === "*")).toBe(false)
  })
})
