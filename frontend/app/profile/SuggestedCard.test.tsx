import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import SuggestedCard, { type SuggestedSpot } from "./SuggestedCard"

const base: SuggestedSpot = { id: 5, name: "Camping del Arroyo", slug: null, category: "Camping", department: "Rocha", status: "pending", rejection_reason: null, image: null }

describe("SuggestedCard", () => {
  it("en revisión o rechazado se administra (para corregirlo); rechazado muestra el motivo", () => {
    render(<SuggestedCard spots={[{ ...base, status: "rejected", rejection_reason: "Faltan fotos" }]} />)
    expect(screen.getByText("Rechazado")).toBeTruthy()
    expect(screen.getByText("Motivo: Faltan fotos")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Administrar →" }).getAttribute("href")).toBe("/dashboard/spots/5")
  })

  it("publicado lleva a su página", () => {
    render(<SuggestedCard spots={[{ ...base, status: "approved", slug: "camping-del-arroyo" }]} />)
    expect(screen.getByText("Publicado")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Ver →" }).getAttribute("href")).toBe("/spots/camping-del-arroyo")
  })

  it("sin sugeridos no se muestra", () => {
    const { container } = render(<SuggestedCard spots={[]} />)
    expect(container.innerHTML).toBe("")
  })
})
