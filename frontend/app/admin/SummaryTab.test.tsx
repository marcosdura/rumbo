import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import SummaryTab, { delta, type AdminSummary } from "./SummaryTab"

const queue = (count: number, oldest: string | null = null) => ({ count, oldest })
const pair = (current: number, previous: number) => ({ current, previous })
const NOW = new Date("2026-10-12T12:00:00Z").getTime()

const summary = (extra: Partial<AdminSummary> = {}): AdminSummary => ({
  queues: {
    new_spots: queue(2, "2026-10-09T12:00:00Z"), changes: queue(0), contributions: queue(1, "2026-10-12T10:00:00Z"),
    reports: queue(0), claims: queue(0),
  },
  metrics: { users: pair(5, 2), reviews: pair(3, 3), favorites: pair(1, 4), views: pair(120, 80), new_spots: pair(0, 0) },
  views_by_day: [{ day: "2026-10-11", count: 4 }, { day: "2026-10-12", count: 6 }],
  top_viewed: [{ id: 1, name: "Cabo Polonio", slug: "cabo-polonio", count: 40 }],
  top_favorited: [],
  content_health: {
    no_photos: { count: 10, spots: [{ id: 3, name: "Sin foto", slug: "sin-foto" }] },
    no_description: { count: 0, spots: [] },
    no_reviews: { count: 1, spots: [{ id: 4, name: "Nuevo", slug: null }] },
  },
  ...extra,
})

const render_ = (s = summary(), onGo: (t: string) => void = () => {}) =>
  render(<SummaryTab summary={s} loading={false} error={null} onGo={onGo} now={NOW} />)

describe("Resumen del admin: bandeja", () => {
  it("cada cola dice cuántos hay y hace cuánto espera el más viejo; las vacías, al día", () => {
    render_()
    const nuevos = screen.getByRole("button", { name: /Lugares nuevos/ })
    expect(nuevos.textContent).toBe("2Lugares nuevosEl más viejo, hace 3 días")
    expect(screen.getByRole("button", { name: /Reportes/ }).textContent).toContain("Al día ✓")
    expect(screen.getByText("Para revisar (3)")).toBeTruthy()
  })

  it("lo pendiente se distingue de lo que está al día (color y franja)", () => {
    render_()
    expect(screen.getByRole("button", { name: /Lugares nuevos/ }).className).toContain("has-work")
    expect(screen.getByRole("button", { name: /Reportes/ }).className).toContain("is-clear")
  })

  it("tocar una cola lleva a su pestaña", () => {
    const went: string[] = []
    render_(summary(), t => went.push(t))
    fireEvent.click(screen.getByRole("button", { name: /Aportes de la comunidad/ }))
    fireEvent.click(screen.getByRole("button", { name: /Lugares nuevos/ }))
    expect(went).toEqual(["cambios", "nuevos"])
  })
})

describe("Resumen del admin: métricas", () => {
  it("compara con los 30 días anteriores", () => {
    expect(delta(pair(5, 2))).toEqual({ text: "▲ 3", tone: "up" })
    expect(delta(pair(1, 4))).toEqual({ text: "▼ 3", tone: "down" })
    expect(delta(pair(3, 3))).toEqual({ text: "= igual", tone: "same" })
  })

  it("muestra el número, el nombre y la diferencia", () => {
    render_()
    expect(screen.getByText("Visitas a lugares").parentElement!.textContent).toBe("120Visitas a lugares▲ 40 vs. 30 días anteriores")
  })

  it("el gráfico de visitas dice el total para quien no lo ve", () => {
    render_()
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("Visitas por día, últimos 30 días: 10 en total")
  })
})

describe("Resumen del admin: listas", () => {
  it("los más vistos llevan a la página del lugar; sin datos lo dice", () => {
    render_()
    expect(screen.getByRole("link", { name: "Cabo Polonio" }).getAttribute("href")).toBe("/spots/cabo-polonio")
    expect(screen.getByText("Todavía no hay datos.")).toBeTruthy()
  })

  it("contenido para completar: el total, algunos de ejemplo y cuántos más", () => {
    render_()
    expect(screen.getByText(/Sin fotos/).textContent).toBe("Sin fotos: 10")
    expect(screen.getByText("y 9 más")).toBeTruthy()
    expect(screen.getByText(/Sin descripción/).textContent).toBe("Sin descripción: ninguno ✓")
    // Sin slug (no publicado todavía): al panel del lugar.
    expect(screen.getByRole("link", { name: "Nuevo" }).getAttribute("href")).toBe("/dashboard/spots/4")
  })

  it("si falla la carga lo dice", () => {
    render(<SummaryTab summary={null} loading={false} error="No se pudo cargar el resumen." onGo={() => {}} />)
    expect(screen.getByRole("alert").textContent).toBe("No se pudo cargar el resumen.")
  })
})
