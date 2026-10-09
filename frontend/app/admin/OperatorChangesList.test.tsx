import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import OperatorChangesList, { type AdminOperatorChange } from "./OperatorChangesList"

const change: AdminOperatorChange = {
  id: 4, kind: "surf_school", operator_id: 9, requested_by: "operador@test.com", created_at: null,
  changes: {
    name: { from: "Escuela Ola", to: "Ola Nueva" },
    photos: { from: ["https://res.cloudinary.com/x/a.jpg"], to: ["https://res.cloudinary.com/x/a.jpg", "https://res.cloudinary.com/x/n.jpg"] },
  },
  spot: { id: 3, name: "Playa Brava", slug: "playa-brava" },
  operator: { name: "Escuela Ola", description: null, photos: ["https://res.cloudinary.com/x/a.jpg"] },
}

function renderList(overrides = {}) {
  const props = {
    changes: [change], loadError: null, loading: false, actionLoading: null, actionErrors: {},
    onApprove: vi.fn(), onRejectRequest: vi.fn(), ...overrides,
  }
  render(<OperatorChangesList {...props} />)
  return props
}

describe("OperatorChangesList", () => {
  it("muestra el nombre antes/después y marca las fotos nuevas", () => {
    renderList()
    expect(screen.getByText("Ola Nueva")).toBeTruthy()
    expect(screen.getByText("Escuela de surf")).toBeTruthy()
    expect(screen.getByText("Fotos: así quedarían (2)")).toBeTruthy()
    expect(screen.getAllByText("Nueva")).toHaveLength(1)
  })

  it("aprobar y rechazar avisan con el id del pedido", () => {
    const props = renderList()
    fireEvent.click(screen.getByRole("button", { name: "Aprobar" }))
    fireEvent.click(screen.getByRole("button", { name: "Rechazar" }))
    expect(props.onApprove).toHaveBeenCalledWith(4)
    expect(props.onRejectRequest).toHaveBeenCalledWith(4)
  })

  it("sin pedidos", () => {
    renderList({ changes: [] })
    expect(screen.getByText("No hay cambios pendientes.")).toBeTruthy()
  })
})

describe("OperatorChangesList: descripción", () => {
  it("muestra la descripción nueva", () => {
    renderList({ changes: [{ ...change, changes: { description: { from: null, to: "Clases para toda la familia." } } }] })
    expect(screen.getByText("Descripción")).toBeTruthy()
    expect(screen.getByText("Clases para toda la familia.")).toBeTruthy()
  })
})
