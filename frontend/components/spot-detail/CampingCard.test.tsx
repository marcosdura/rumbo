import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import CampingCard from "./CampingCard"

describe("CampingCard", () => {
  it("muestra el precio del lugar (el que edita el dueño)", () => {
    render(<CampingCard price={650} amenities={[]} />)
    expect(screen.getByText("$650")).toBeTruthy()
  })

  it("sin precio no muestra la celda", () => {
    render(<CampingCard price={null} amenities={[]} />)
    expect(screen.queryByText("Precio por noche")).toBeNull()
  })
})
