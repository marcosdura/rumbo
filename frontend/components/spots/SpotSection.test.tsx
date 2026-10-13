import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@/components/spots/SpotList", () => ({
  default: ({ spots, eager }: { spots: { id: number; name: string }[]; eager?: boolean }) => <>{spots.map(s => <div key={s.id} data-eager={String(!!eager)}>{s.name}</div>)}</>,
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

  it("le pasa a la lista si es la primera fila (para cargar sus fotos de entrada)", () => {
    const { unmount } = render(<SpotSection label="x" title="Primera" count={2} spots={spots(2)} href="/search" loading={false} eager />)
    expect(screen.getByText("Lugar 1").getAttribute("data-eager")).toBe("true")
    unmount()
    render(<SpotSection label="x" title="Otra" count={2} spots={spots(2)} href="/search" loading={false} />)
    expect(screen.getByText("Lugar 1").getAttribute("data-eager")).toBe("false")
  })

  it("sin lugares no se muestra", () => {
    const { container } = render(<SpotSection label="x" title="Vacía" count={0} spots={[]} href="/search" loading={false} />)
    expect(container.innerHTML).toBe("")
  })
})
