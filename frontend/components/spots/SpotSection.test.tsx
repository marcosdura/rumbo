import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@/components/spots/SpotList", () => ({
  default: ({ spots }: { spots: { id: number; name: string }[] }) => <>{spots.map(s => <div key={s.id}>{s.name}</div>)}</>,
}))

const { default: SpotSection } = await import("./SpotSection")

const spots = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Lugar ${i + 1}` }))

describe("SpotSection", () => {
  it("el título y Ver todo abren la búsqueda en la misma pestaña", () => {
    render(<SpotSection label="Por departamento" title="Lugares en Rocha" count={9} spots={spots(6)} href="/search?department=Rocha" loading={false} />)
    const links = screen.getAllByRole("link")
    expect(links.map(l => l.getAttribute("href"))).toEqual(["/search?department=Rocha", "/search?department=Rocha"])
    links.forEach(l => expect(l.getAttribute("target")).toBeNull())
  })

  it("sin lugares no se muestra", () => {
    const { container } = render(<SpotSection label="x" title="Vacía" count={0} spots={[]} href="/search" loading={false} />)
    expect(container.innerHTML).toBe("")
  })
})
