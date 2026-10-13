import { describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import FilterDrawerShell from "./FilterDrawerShell"

function Drawer({ isOpen, applied = "aplicado" }: { isOpen: boolean; applied?: string }) {
  return (
    <FilterDrawerShell isOpen={isOpen} onClose={() => {}} appliedFilters={applied} onApply={() => {}} emptyFilters="">
      {(pending, setPending) => (
        <>
          <p>pendiente: {pending}</p>
          <button onClick={() => setPending("tocado")}>tocar</button>
        </>
      )}
    </FilterDrawerShell>
  )
}

describe("FilterDrawerShell", () => {
  it("abierto de entrada se muestra, con los filtros aplicados", () => {
    render(<Drawer isOpen />)
    expect(screen.getByText("pendiente: aplicado")).toBeTruthy()
  })

  it("al cerrarse se va después de la animación, y al reabrirlo vuelve a los aplicados (descarta lo tocado)", () => {
    vi.useFakeTimers()
    const { rerender } = render(<Drawer isOpen />)
    fireEvent.click(screen.getByRole("button", { name: "tocar" }))
    expect(screen.getByText("pendiente: tocado")).toBeTruthy()
    rerender(<Drawer isOpen={false} />)
    expect(screen.getByText("pendiente: tocado")).toBeTruthy()
    act(() => { vi.advanceTimersByTime(300) })
    expect(screen.queryByText(/pendiente/)).toBeNull()
    rerender(<Drawer isOpen applied="nuevo" />)
    expect(screen.getByText("pendiente: nuevo")).toBeTruthy()
    vi.useRealTimers()
  })

  it("cerrado de entrada no se muestra", () => {
    render(<Drawer isOpen={false} />)
    expect(screen.queryByText(/pendiente/)).toBeNull()
  })
})
