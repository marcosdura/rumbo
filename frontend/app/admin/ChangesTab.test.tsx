import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import type { ComponentProps } from "react"
import ChangesTab from "./ChangesTab"
import type { AdminChangeRequest } from "./types"

function changeRequest(overrides: Partial<AdminChangeRequest["changes"]> = {}, currentName = "Viejo"): AdminChangeRequest {
  return {
    id: 7, spot_id: 3, status: "pending", requested_by: "owner@test.com", created_at: "2026-10-01T12:00:00Z",
    changes: { name: { from: "Viejo", to: "Nuevo" }, ...overrides },
    spot: {
      id: 3, name: currentName, slug: "viejo", department: "Rocha", category: { name: "Camping" },
      images: [{ cloudinary_public_id: "pub/1", is_main: true, order: 0 }],
      current: { name: currentName, description: "desc" },
    },
  }
}

function renderTab(overrides: Partial<ComponentProps<typeof ChangesTab>> = {}) {
  const props: ComponentProps<typeof ChangesTab> = {
    requests: [changeRequest()], loadError: null, loading: false,
    actionLoading: null, actionErrors: {}, onApprove: vi.fn(), onRejectRequest: vi.fn(),
    ...overrides,
  }
  render(<ChangesTab {...props} />)
  return props
}

describe("ChangesTab", () => {
  it("muestra el antes y el después", () => {
    renderTab()
    expect(screen.getByText("ANTES")).toBeTruthy()
    expect(screen.getByText("Nuevo")).toBeTruthy()
    expect(screen.queryByText(/Cambió desde que se hizo el pedido/)).toBeNull()
  })

  it("avisa si el spot cambió desde que se hizo el pedido", () => {
    renderTab({ requests: [changeRequest({}, "Editado por admin")] })
    expect(screen.getByText(/Cambió desde que se hizo el pedido\. Hoy dice: «Editado por admin»/)).toBeTruthy()
  })

  it("muestra las fotos nuevas con cuántas tiene hoy", () => {
    renderTab({ requests: [changeRequest({ name: undefined, photos_added: ["rumbo/spots/3/a", "rumbo/spots/3/b"] })] })
    expect(screen.getByText("2 fotos nuevas · hoy tiene 1")).toBeTruthy()
    expect(document.querySelectorAll(".photo-grid a")).toHaveLength(2)
  })

  it("aprobar y rechazar avisan al padre con el id del pedido", () => {
    const props = renderTab()
    fireEvent.click(screen.getByRole("button", { name: "Aprobar" }))
    fireEvent.click(screen.getByRole("button", { name: "Rechazar" }))
    expect(props.onApprove).toHaveBeenCalledWith(7)
    expect(props.onRejectRequest).toHaveBeenCalledWith(7)
  })

  it("muestra el error de esa fila", () => {
    renderTab({ actionErrors: { 7: 'Ya existe otro lugar llamado "Nuevo".' } })
    expect(screen.getByText('Ya existe otro lugar llamado "Nuevo".')).toBeTruthy()
  })

  it("mientras procesa, deshabilita los botones", () => {
    renderTab({ actionLoading: 7 })
    expect((screen.getByRole("button", { name: "Procesando..." }) as HTMLButtonElement).disabled).toBe(true)
  })

  it("sin pedidos", () => {
    renderTab({ requests: [] })
    expect(screen.getByText("No hay cambios pendientes.")).toBeTruthy()
  })
})

describe("ChangesTab: ubicación", () => {
  it("antes y después, cada una abre en Google Maps", () => {
    const req = changeRequest({ name: undefined, location: { from: [-34, -55], to: [-34.5, -55.25] } })
    req.spot.current.location = [-34, -55]
    renderTab({ requests: [req] })
    expect(screen.getByText("Ubicación")).toBeTruthy()
    expect(screen.getByRole("link", { name: "-34.5, -55.25" }).getAttribute("href")).toBe("https://www.google.com/maps?q=-34.5,-55.25")
    expect(screen.getByRole("link", { name: "-34, -55" })).toBeTruthy()
    expect(screen.queryByText(/Cambió desde que se hizo el pedido/)).toBeNull()
  })

  it("avisa si la ubicación cambió mientras esperaba", () => {
    const req = changeRequest({ name: undefined, location: { from: [-34, -55], to: [-34.5, -55.25] } })
    req.spot.current.location = [-33, -56]
    renderTab({ requests: [req] })
    expect(screen.getByText(/Cambió desde que se hizo el pedido\. Hoy: -33, -56/)).toBeTruthy()
  })
})
