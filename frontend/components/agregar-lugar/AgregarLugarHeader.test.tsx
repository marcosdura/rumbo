import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("next/image", () => ({ default: ({ alt }: { alt: string }) => <span>{alt}</span> }))

const { default: AgregarLugarHeader } = await import("./AgregarLugarHeader")

describe("encabezado del formulario", () => {
  it("siempre ofrece volver a la app, también en el primer paso", () => {
    render(<AgregarLugarHeader stepLabel="" canReset={false} onReset={() => {}} />)
    const back = screen.getByRole("link", { name: "← Volver a Rumbo" })
    expect(back.getAttribute("href")).toBe("/")
    expect(screen.queryByRole("button", { name: "Empezar de cero" })).toBeNull()
  })

  it("ya avanzado, vuelve a la app y también deja empezar de cero", () => {
    render(<AgregarLugarHeader stepLabel="Paso 2 de 5" canReset onReset={() => {}} />)
    expect(screen.getByRole("link", { name: "← Volver a Rumbo" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Empezar de cero" })).toBeTruthy()
  })
})
