import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import CampingCard from "./CampingCard"

describe("CampingCard", () => {
  it("muestra los servicios, sin repetir el precio (va en Detalles)", () => {
    render(<CampingCard amenities={[{ id: 22, name: "WiFi" }]} />)
    expect(screen.getByText(/WiFi/)).toBeTruthy()
    expect(screen.queryByText(/Precio/)).toBeNull()
  })

  it("sin servicios no aparece", () => {
    const { container } = render(<CampingCard amenities={[]} />)
    expect(container.innerHTML).toBe("")
  })
})
