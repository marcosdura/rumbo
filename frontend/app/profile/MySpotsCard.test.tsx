import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import MySpotsCard from "./MySpotsCard"

describe("MySpotsCard", () => {
  it("sin lugares se muestra igual, con el acceso a cargar uno", () => {
    render(<MySpotsCard mySpots={[]} />)
    expect(screen.getByText("Tus lugares")).toBeTruthy()
    expect(screen.getByRole("link", { name: "＋ Agregar un lugar" }).getAttribute("href")).toBe("/agregar-lugar")
  })

  it("con lugares, cada uno con su acceso a administrar", () => {
    render(<MySpotsCard mySpots={[{ id: 4, name: "Cascada", is_approved: true, review_count: 2, images: [] }]} />)
    expect(screen.getByText("Cascada")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Administrar →" }).getAttribute("href")).toBe("/dashboard/spots/4")
    expect(screen.queryByText("＋ Agregar un lugar")).toBeNull()
  })

  it("un lugar rechazado se marca como tal", () => {
    render(<MySpotsCard mySpots={[{ id: 5, name: "Mi lugar", is_approved: false, rejected_at: "2026-10-02", review_count: 0, images: [] }]} />)
    expect(screen.getByText("Rechazado")).toBeTruthy()
    expect(screen.queryByText("Pendiente")).toBeNull()
  })
})
