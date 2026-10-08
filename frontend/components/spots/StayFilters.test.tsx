import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { GlampingFilterDrawer, MotorhomeFilterDrawer } from "./StayFilters"
import { EMPTY_GLAMPING_FILTERS, EMPTY_MOTORHOME_FILTERS } from "@/lib/stay-filters"
import { GLAMPING_CODEC, MOTORHOME_CODEC, filterChips, hasFilterPanel } from "@/lib/searchFilters"

describe("Glamping y Motorhome tienen panel de filtros", () => {
  it("glamping: precio por noche y servicios", () => {
    const applied: unknown[] = []
    render(<GlampingFilterDrawer isOpen onClose={() => {}} appliedFilters={EMPTY_GLAMPING_FILTERS} onApply={f => applied.push(f)} />)
    fireEvent.click(screen.getByRole("button", { name: "Hasta $3.000" }))
    fireEvent.click(screen.getByRole("button", { name: "🛜 WiFi" }))
    fireEvent.click(screen.getByRole("button", { name: /Aplicar|Ver/ }))
    expect(applied).toEqual([{ priceRanges: ["bajo"], amenities: ["wifi"] }])
  })

  it("motorhome: servicios", () => {
    const applied: unknown[] = []
    render(<MotorhomeFilterDrawer isOpen onClose={() => {}} appliedFilters={EMPTY_MOTORHOME_FILTERS} onApply={f => applied.push(f)} />)
    fireEvent.click(screen.getByRole("button", { name: "💧 Agua" }))
    fireEvent.click(screen.getByRole("button", { name: /Aplicar|Ver/ }))
    expect(applied).toEqual([{ services: ["water"] }])
  })

  it("van y vienen por la URL, con chips legibles", () => {
    expect(hasFilterPanel("Glamping") && hasFilterPanel("Motorhome")).toBe(true)
    const p = new URLSearchParams()
    GLAMPING_CODEC.toParams({ priceRanges: ["alto"], amenities: ["kitchen"] }, p)
    MOTORHOME_CODEC.toParams({ services: ["dump"] }, p)
    expect(p.toString()).toBe("glamping_price=alto&glamping_amenity=kitchen&motorhome_service=dump")
    expect(GLAMPING_CODEC.fromParams(p)).toEqual({ priceRanges: ["alto"], amenities: ["kitchen"] })
    expect(filterChips(p).map(c => c.label)).toEqual(["Precio: Más de $6.000", "🍳 Cocina equipada", "🚽 Vaciado de aguas"])
  })
})
