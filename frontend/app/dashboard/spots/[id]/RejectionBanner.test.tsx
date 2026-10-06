import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import RejectionBanner from "./RejectionBanner"

describe("RejectionBanner", () => {
  it("muestra el motivo y permite volver a enviar", () => {
    const onResubmit = vi.fn()
    render(<RejectionBanner reason="Faltan fotos del lugar" onResubmit={onResubmit} resubmitting={false} error={null} />)
    expect(screen.getByText("Motivo: Faltan fotos del lugar")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Volver a enviar a revisión" }))
    expect(onResubmit).toHaveBeenCalledOnce()
  })

  it("mientras envía se deshabilita, y muestra el error si falla", () => {
    render(<RejectionBanner reason="x" onResubmit={vi.fn()} resubmitting error="No se pudo enviar." />)
    expect((screen.getByRole("button", { name: "Enviando..." }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText("No se pudo enviar.")).toBeTruthy()
  })
})
