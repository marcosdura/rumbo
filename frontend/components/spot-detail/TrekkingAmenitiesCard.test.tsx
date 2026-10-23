import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import TrekkingAmenitiesCard from "./TrekkingAmenitiesCard"
import type { TrekkingDetail } from "@/lib/types"

describe("características del trekking", () => {
  it("lo que no hay se dice en castellano y con su ícono", () => {
    // Antes: "No Accesible" (sin ♿) al lado de "Transporte público: Accesible".
    render(<TrekkingAmenitiesCard trekkingDetail={{ accessible: false, bathrooms: false, kids_friendly: false, parking: true } as TrekkingDetail} />)
    expect(screen.getByText("♿ No accesible en silla de ruedas")).toBeTruthy()
    expect(screen.getByText("🚽 Sin baños")).toBeTruthy()
    expect(screen.getByText("👶 No apto para niños")).toBeTruthy()
    expect(screen.getByText("🚗 Estacionamiento")).toBeTruthy()
  })

  it("lo que no se sabe no aparece", () => {
    const { container } = render(<TrekkingAmenitiesCard trekkingDetail={{ accessible: null } as TrekkingDetail} />)
    expect(container.innerHTML).toBe("")
  })
})
