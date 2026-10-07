import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import StepResumen from "./StepResumen"
import { CATEGORIES, defaultKayak, defaultSurf, defaultTrekkingFeatures, emptyBasic } from "../constants"

const cat = (name: string) => CATEGORIES.find(c => c.name === name)!

const common = {
  isService: true, createsSpot: false, basic: emptyBasic(), trekkingFeatures: defaultTrekkingFeatures(), routes: [],
  availableSpots: [{ id: 3, name: "Laguna" }], selectedSpotId: 3,
  submitting: false, uploadProgress: null, error: null, onSubmit: () => {}, onBack: () => {}, editTo: () => undefined,
}

const row = (label: string) => screen.getByText(label).parentElement!.textContent

describe("Resumen: muestra lo que eligió la persona, no los códigos", () => {
  it("kayak: tipo de agua, dificultad, tipo, temporada con meses, y No sé", () => {
    render(
      <StepResumen {...common} selectedCat={cat("Kayak")} surf={defaultSurf()} kayaks={[{
        ...defaultKayak(), name: "Kayak Sur", water_type: "rio", difficulty: "facil", kayak_type: "travesia",
        season_type: "seasonal", season_start: "11", season_end: "3",
      }]} />,
    )
    expect(row("Tipo de agua")).toContain("Río")
    expect(row("Dificultad")).toContain("Fácil")
    expect(row("Tipo de kayak")).toContain("Travesía")
    expect(row("Temporada")).toContain("Estacional (Noviembre a Marzo)")
    // Sin contestar no es "No".
    expect(row("Alquiler disponible")).toContain("No sé")
  })

  it("surf: tipo de clase y equipo sin contestar", () => {
    render(<StepResumen {...common} selectedCat={cat("Surf")} kayaks={[]} surf={{ ...defaultSurf(), name: "Ola", class_type: "grupal" }} />)
    expect(row("Tipo de clase")).toContain("Grupal")
    expect(row("Equipo incluido")).toContain("No sé")
  })

  it("el botón para volver dice Atrás, como en los demás pasos", () => {
    render(<StepResumen {...common} selectedCat={cat("Surf")} kayaks={[]} surf={{ ...defaultSurf(), name: "Ola" }} />)
    expect(screen.getByRole("button", { name: "Atrás" })).toBeTruthy()
  })
})

describe("Equipo y alquiler arrancan en No sé (antes se guardaba No)", () => {
  it("valores por defecto", () => {
    expect(defaultSurf().equipment_include).toBeNull()
    expect(defaultKayak().rental_available).toBeNull()
  })
})
