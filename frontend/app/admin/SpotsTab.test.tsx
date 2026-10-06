import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import type { ComponentProps } from "react"
import SpotsTab from "./SpotsTab"
import { spotStatus, type AdminSpot } from "./types"

function spot(overrides: Partial<AdminSpot> = {}): AdminSpot {
  return {
    id: 1, name: "Cascada", department: "Rocha", is_approved: false, owner_email: "a@b.com",
    owner_deleted_at: null, slug: "cascada", created_at: "2026-10-01T00:00:00Z",
    category: { name: "Camping" }, images: [], review_count: 0, ...overrides,
  }
}

function renderTab(displayed: AdminSpot[]) {
  const props: ComponentProps<typeof SpotsTab> = {
    displayed, pending: 1, rejected: 1, filter: "all", setFilter: vi.fn(),
    searchSpots: "", setSearchSpots: vi.fn(), sortBy: "date_desc", setSortBy: vi.fn(),
    loadError: null, loading: false, actionLoading: null,
    onApprove: vi.fn(), onRejectRequest: vi.fn(), onEdit: vi.fn(), onDeleteRequest: vi.fn(),
  }
  render(<SpotsTab {...props} />)
  return props
}

describe("spotStatus", () => {
  it("distingue pendiente, rechazado y aprobado", () => {
    expect(spotStatus(spot())).toBe("pending")
    expect(spotStatus(spot({ rejected_at: "2026-10-02" }))).toBe("rejected")
    expect(spotStatus(spot({ is_approved: true }))).toBe("approved")
  })
})

describe("SpotsTab", () => {
  it("un pendiente se aprueba o se rechaza (con motivo)", () => {
    const s = spot()
    const props = renderTab([s])
    fireEvent.click(screen.getByRole("button", { name: "Rechazar" }))
    expect(props.onRejectRequest).toHaveBeenCalledWith(s)
    fireEvent.click(screen.getByRole("button", { name: "Aprobar" }))
    expect(props.onApprove).toHaveBeenCalledWith(1, true)
  })

  it("desaprobar un aprobado pide motivo", () => {
    const s = spot({ is_approved: true })
    const props = renderTab([s])
    fireEvent.click(screen.getByRole("button", { name: "Desaprobar" }))
    expect(props.onRejectRequest).toHaveBeenCalledWith(s)
    expect(props.onApprove).not.toHaveBeenCalled()
  })

  it("un rechazado muestra el motivo y se puede aprobar, no volver a rechazar", () => {
    renderTab([spot({ rejected_at: "2026-10-02", rejection_reason: "Faltan fotos" })])
    expect(screen.getByText("Rechazado")).toBeTruthy()
    expect(screen.getByText("Motivo: Faltan fotos")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Rechazar" })).toBeNull()
    expect(screen.getByRole("button", { name: "Aprobar" })).toBeTruthy()
  })
})
