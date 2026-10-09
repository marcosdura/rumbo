import { describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"

// API y carrusel simulados con valores comunes, no vi.fn.
let nearby: { id: number; name: string }[] = []
const requested: string[] = []
vi.mock("@/lib/api", () => ({
  api: { get: (url: string) => { requested.push(url); return Promise.resolve({ data: nearby }) } },
}))
vi.mock("@/components/spots/SpotSection", () => ({
  default: ({ title, spots }: { title: string; spots: { id: number; name: string }[] }) =>
    spots.length === 0 ? null : <section><h2>{title}</h2>{spots.map(s => <p key={s.id}>{s.name}</p>)}</section>,
}))

const { default: NearbySpots } = await import("./NearbySpots")

describe("Cerca de acá", () => {
  it("muestra los lugares cercanos que devuelve el backend", async () => {
    nearby = [{ id: 2, name: "Laguna de Rocha" }]
    render(<NearbySpots spotId={7} />)
    await act(() => Promise.resolve())
    expect(requested.at(-1)).toBe("/spots/7/nearby")
    expect(screen.getByRole("heading", { name: "Cerca de acá" })).toBeTruthy()
    expect(screen.getByText("Laguna de Rocha")).toBeTruthy()
  })

  it("sin cercanos no aparece", async () => {
    nearby = []
    const { container } = render(<NearbySpots spotId={7} />)
    await act(() => Promise.resolve())
    expect(container.innerHTML).toBe("")
  })
})
