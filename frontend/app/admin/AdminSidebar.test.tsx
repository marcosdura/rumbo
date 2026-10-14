import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import AdminSidebar from "./AdminSidebar"

const groups = [
  { title: "Por revisar", tabs: [{ id: "nuevos" as const, label: "🆕 Lugares nuevos" }, { id: "reportes" as const, label: "⚑ Reportes" }] },
  { title: "Gestión", tabs: [{ id: "lugares" as const, label: "🗺️ Lugares" }] },
]

describe("AdminSidebar", () => {
  it("todas las secciones, agrupadas, con cuánto hay en cada una", () => {
    render(<AdminSidebar groups={groups} mode="resumen" counts={{ nuevos: 3, reportes: 0 }} onGo={() => {}} />)
    expect(screen.getByRole("navigation", { name: "Secciones del panel" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "🆕 Lugares nuevos 3" })).toBeTruthy()
    // Sin pendientes, sin contador.
    expect(screen.getByRole("button", { name: "⚑ Reportes" })).toBeTruthy()
    expect(screen.getByRole("list", { name: "Gestión" }).textContent).toContain("Lugares")
  })

  it("marca la sección actual y avisa al elegir otra", () => {
    const onGo = vi.fn()
    render(<AdminSidebar groups={groups} mode="lugares" counts={{}} onGo={onGo} />)
    expect(screen.getByRole("button", { name: "🗺️ Lugares" }).getAttribute("aria-current")).toBe("page")
    expect(screen.getByRole("button", { name: "📊 Resumen" }).hasAttribute("aria-current")).toBe(false)
    fireEvent.click(screen.getByRole("button", { name: "⚑ Reportes" }))
    expect(onGo).toHaveBeenCalledWith("reportes")
  })
})
