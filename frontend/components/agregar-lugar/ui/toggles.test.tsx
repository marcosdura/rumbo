import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import BinaryToggle from "./BinaryToggle"
import SeasonToggle from "./SeasonToggle"

// Los botones de opción dicen cuál está elegido (antes solo por el color).
describe("botones de opción del formulario", () => {
  it("Sí / No", () => {
    render(<BinaryToggle value={true} onChange={() => {}} />)
    expect(screen.getByRole("button", { name: "Sí" }).getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByRole("button", { name: "No" }).getAttribute("aria-pressed")).toBe("false")
  })

  it("temporada: cuál está elegida, y los meses tienen nombre", () => {
    render(<SeasonToggle type="seasonal" onTypeChange={() => {}} start="" onStartChange={() => {}} end="" onEndChange={() => {}} />)
    expect(screen.getByRole("button", { name: "Por temporada" }).getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByRole("button", { name: "Todo el año" }).getAttribute("aria-pressed")).toBe("false")
    expect(screen.getByRole("combobox", { name: "Desde" })).toBeTruthy()
    expect(screen.getByRole("combobox", { name: "Hasta" })).toBeTruthy()
  })
})
