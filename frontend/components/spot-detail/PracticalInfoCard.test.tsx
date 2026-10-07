import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import PracticalInfoCard from "./PracticalInfoCard"
import GlampingAmenitiesList from "./GlampingAmenitiesList"
import AmenitiesList from "./AmenitiesList"
import { knownPractical } from "@/lib/practicalInfo"

describe("Información práctica", () => {
  it("muestra solo lo que se sabe", () => {
    render(<PracticalInfoCard info={{ pets_allowed: true, reservation_required: null, cell_signal: false }} />)
    expect(screen.getByText("Acepta mascotas")).toBeTruthy()
    expect(screen.getByText("Sin señal de celular")).toBeTruthy()
    expect(screen.queryByText(/reservar/)).toBeNull()
  })

  it("si no se sabe nada, no aparece", () => {
    const { container } = render(<PracticalInfoCard info={{}} />)
    expect(container.innerHTML).toBe("")
  })

  it("knownPractical en orden: mascotas, reserva, señal", () => {
    expect(knownPractical({ cell_signal: true, reservation_required: true }).map(i => i.text))
      .toEqual(["Hay que reservar", "Hay señal de celular"])
  })
})

describe("Mascotas ya no se repite en las listas viejas", () => {
  it("glamping: pet_friendly (dato viejo) no se muestra", () => {
    const { container } = render(<GlampingAmenitiesList amenities={{ pet_friendly: true } as never} />)
    expect(container.innerHTML).toBe("")
  })

  it("camping: el amenity Acepta mascotas no se muestra", () => {
    render(<AmenitiesList amenities={[{ id: 23, name: "Acepta mascotas" }, { id: 22, name: "WiFi" }]} />)
    expect(screen.queryByText(/Acepta mascotas/)).toBeNull()
    expect(screen.getByText(/WiFi/)).toBeTruthy()
  })
})
