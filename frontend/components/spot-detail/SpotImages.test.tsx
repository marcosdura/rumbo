import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

// El CldImage simulado deja ver cómo se pidió cada foto.
vi.mock("next-cloudinary", () => ({
  CldImage: (p: { alt: string; src: string; priority?: boolean; loading?: string }) =>
    <img alt={p.alt} src={p.src} data-priority={String(!!p.priority)} data-loading={p.loading ?? ""} />,
}))
vi.mock("./ImageGallery", () => ({
  default: ({ startIndex }: { startIndex: number }) => <div role="dialog">galería desde {startIndex}</div>,
}))

// SpotImages es .jsx: TypeScript infiere `images` como never[] por el default.
const SpotImages = (await import("./SpotImages")).default as unknown as
  (props: { images: { cloudinary_public_id: string }[]; name: string }) => React.ReactElement | null

const images = [1, 2, 3].map(i => ({ cloudinary_public_id: `rumbo/spots/1/foto${i}` }))

describe("SpotImages", () => {
  it("tocar una foto abre la galería en esa foto", () => {
    render(<SpotImages images={images} name="Cascada" />)
    fireEvent.click(screen.getByAltText("Cascada 2"))
    expect(screen.getByRole("dialog").textContent).toBe("galería desde 1")
  })

  it("abrir la galería no vuelve a montar las fotos", () => {
    render(<SpotImages images={images} name="Cascada" />)
    const before = screen.getByAltText("Cascada 1")
    fireEvent.click(before)
    expect(screen.getByAltText("Cascada 1")).toBe(before)
  })

  it("sin fotos no muestra nada", () => {
    const { container } = render(<SpotImages images={[]} name="Cascada" />)
    expect(container.innerHTML).toBe("")
  })

  it("solo la foto principal carga con prioridad; las demás, en diferido", () => {
    const five = [1, 2, 3, 4, 5, 6].map(i => ({ cloudinary_public_id: `rumbo/spots/1/foto${i}` }))
    render(<SpotImages images={five} name="Cascada" />)
    const imgs = screen.getAllByRole("img")
    expect(imgs.map(i => i.dataset.priority)).toEqual(["true", "false", "false", "false", "false"])
    expect(imgs.slice(1).every(i => i.dataset.loading === "lazy")).toBe(true)
  })
})
