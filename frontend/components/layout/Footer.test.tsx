import { afterEach, describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import { render, screen } from "@testing-library/react"

vi.mock("next/image", () => ({ default: (props: { alt: string }) => <img alt={props.alt} /> }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }), useSearchParams: () => new URLSearchParams() }))

const { default: Footer, EXPLORE_LINKS } = await import("./Footer")
const { activities } = await import("@/components/spots/SearchBar") as unknown as { activities: string[] }

afterEach(() => vi.useRealTimers())

describe("Footer", () => {
  it("Explorar: cada actividad lleva a su página, y está Sumá un lugar", () => {
    render(<Footer />)
    expect(screen.getByRole("link", { name: "🧗 Escalada" }).getAttribute("href")).toBe("/lugares/escalada")
    for (const l of EXPLORE_LINKS) expect(screen.getByRole("link", { name: l.label }).getAttribute("href")).not.toContain("/search")
    expect(screen.getByRole("link", { name: "＋ Sumá un lugar" }).getAttribute("href")).toBe("/agregar-lugar")
  })

  it("las actividades son las mismas que las del buscador (si no, el link no filtra)", () => {
    expect(EXPLORE_LINKS.map(l => l.activity).sort()).toEqual([...activities].sort())
  })

  it("el año del © es el actual (decía 2025 fijo)", () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2027-03-01T12:00:00Z"))
    render(<Footer />)
    expect(screen.getByText(/© 2027 Rumbo Uruguay/)).toBeTruthy()
  })

  it("habla de aire libre, no de ciudades", () => {
    render(<Footer />)
    expect(document.body.textContent).not.toMatch(/ciudades/)
  })

  it("es un componente de servidor: no manda JavaScript a cada página", () => {
    expect(readFileSync("components/layout/Footer.jsx", "utf-8")).not.toMatch(/^\s*["']use client["']/)
  })

  it("no dice 'Código abierto' (el repo no tiene licencia)", () => {
    render(<Footer />)
    expect(document.body.textContent).not.toMatch(/Código abierto/)
  })
})
