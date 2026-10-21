import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

vi.mock("./ItemPhotos", () => ({ default: ({ name }: { name: string }) => <p>fotos de {name}</p> }))

const { default: ViasTable } = await import("./ViasTable")

const via = (id: number, name: string, extra: Record<string, unknown> = {}) => ({
  id, name, grade: "6a", bolts: 8, length: 20, description: `Descripción de ${name}`, type: null,
  photos: [], photo_slots: 3, ...extra,
}) as never

describe("ViasTable", () => {
  it("la flecha va a la izquierda del nombre", () => {
    render(<ViasTable vias={[via(1, "La Diagonal")]} spotId={3} />)
    const row = screen.getByRole("button", { name: /La Diagonal/ })
    expect(row.firstElementChild!.className).toBe("via-chevron")
  })

  it("abierta, la vía y su detalle son una sola tarjeta (se ve de qué vía es)", () => {
    render(<ViasTable vias={[via(1, "La Diagonal"), via(2, "El Techo")]} spotId={3} />)
    fireEvent.click(screen.getByRole("button", { name: /La Diagonal/ }))
    const row = screen.getByRole("button", { name: /La Diagonal/ })
    expect(row.getAttribute("aria-expanded")).toBe("true")
    const card = row.closest(".via-item")!
    expect(card.className).toContain("is-open")
    expect(card.contains(screen.getByText("fotos de La Diagonal"))).toBe(true)
    // La otra queda cerrada y fuera de esa tarjeta.
    expect(screen.getByRole("button", { name: /El Techo/ }).closest(".via-item")!.className).not.toContain("is-open")
    fireEvent.click(row)
    expect(card.className).not.toContain("is-open")
  })

  it("se abren varias a la vez; con dos o más abiertas, «Cerrar todas» las cierra", () => {
    render(<ViasTable vias={[via(1, "La Diagonal"), via(2, "El Techo"), via(3, "La Fisura")]} spotId={3} />)
    const row = (name: string) => screen.getByRole("button", { name: new RegExp(name) })
    fireEvent.click(row("La Diagonal"))
    expect(screen.queryByRole("button", { name: /Cerrar todas/ })).toBeNull()
    fireEvent.click(row("El Techo"))
    expect(row("La Diagonal").getAttribute("aria-expanded")).toBe("true")
    expect(row("El Techo").getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByText("fotos de La Diagonal")).toBeTruthy()
    expect(screen.getByText("fotos de El Techo")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Cerrar todas (2)" }))
    expect(screen.queryAllByRole("button", { expanded: true })).toHaveLength(0)
    expect(screen.queryByRole("button", { name: /Cerrar todas/ })).toBeNull()
  })

  it("sin vías, lo dice", () => {
    render(<ViasTable vias={[]} spotId={3} />)
    expect(screen.getByText("Todavía no hay vías cargadas en este sector.")).toBeTruthy()
  })
})
