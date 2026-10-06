import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import ChangeRequestBanner from "./ChangeRequestBanner"
import type { ChangeRequest } from "./types"

function request(overrides: Partial<ChangeRequest> = {}): ChangeRequest {
  return {
    id: 1, status: "pending", reject_reason: null, created_at: null, resolved_at: null,
    changes: { name: { from: "Viejo", to: "Nuevo" }, photos_added: ["a", "b"] },
    ...overrides,
  }
}

function renderBanner(req: ChangeRequest) {
  const onCancel = vi.fn()
  const onDismiss = vi.fn()
  const utils = render(<ChangeRequestBanner request={req} onCancel={onCancel} onDismiss={onDismiss} dismissing={false} />)
  return { ...utils, onCancel, onDismiss }
}

describe("ChangeRequestBanner", () => {
  it("pendiente: dice qué está en revisión y permite cancelar", () => {
    const { onCancel, onDismiss } = renderBanner(request())
    expect(screen.getByText("⏳ Cambio en revisión: nombre y 2 fotos nuevas")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Cancelar cambio" }))
    expect(onCancel).toHaveBeenCalledOnce()
    expect(screen.queryByRole("button", { name: "Cerrar aviso" })).toBeNull()
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it("aprobado: se puede cerrar con la X", () => {
    const { onDismiss } = renderBanner(request({ status: "approved" }))
    expect(screen.getByText(/tu cambio fue aprobado y ya está publicado/)).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Cancelar cambio" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it("rechazado: muestra el motivo y que las fotos se descartaron", () => {
    renderBanner(request({ status: "rejected", reject_reason: "La foto no es del lugar" }))
    expect(screen.getByText("Tu cambio de nombre y 2 fotos nuevas fue rechazado.")).toBeTruthy()
    expect(screen.getByText("Motivo: La foto no es del lugar")).toBeTruthy()
    expect(screen.getByText("Las fotos nuevas se descartaron.")).toBeTruthy()
  })

  it("rechazado sin motivo ni fotos", () => {
    renderBanner(request({ status: "rejected", changes: { description: { from: "a", to: "b" } } }))
    expect(screen.queryByText(/Motivo/)).toBeNull()
    expect(screen.queryByText(/fotos nuevas se descartaron/)).toBeNull()
  })

  it("cancelado: no muestra nada", () => {
    const { container } = renderBanner(request({ status: "cancelled" }))
    expect(container.innerHTML).toBe("")
  })
})
