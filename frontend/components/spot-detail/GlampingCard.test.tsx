import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import GlampingCard from "./GlampingCard"

describe("la ficha del glamping", () => {
  it("muestra el precio con separador de miles y el mínimo de noches", () => {
    render(<GlampingCard glampingDetail={[{ accommodation_type: "domo", capacity: 2, price_per_night: 4000, min_nights: 2 }]} />)
    expect(screen.getByText("$4.000")).toBeTruthy()
    expect(screen.getByText("2 noches")).toBeTruthy()
  })

  it("un precio en 0 no se muestra, y 0 noches es «Sin mínimo»", () => {
    // Antes: "Precio por noche $0" y "Mínimo de noches 0 noches".
    render(<GlampingCard glampingDetail={[{ accommodation_type: "cabaña", capacity: 7, price_per_night: 0, min_nights: 0 }]} />)
    expect(screen.queryByText("Precio por noche")).toBeNull()
    expect(screen.queryByText("$0")).toBeNull()
    expect(screen.getByText("Sin mínimo")).toBeTruthy()
  })
})
