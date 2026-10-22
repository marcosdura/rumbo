import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

vi.mock("next-cloudinary", () => ({ CldImage: ({ alt, priority, sizes }: { alt: string; priority?: boolean; sizes?: string }) => <span role="img" aria-label={alt} data-priority={priority ? "si" : "no"} data-sizes={sizes} /> }))
vi.mock("./ImageGallery", () => ({ default: ({ startIndex }: { startIndex: number }) => <div role="dialog">foto {startIndex + 1}</div> }))

const { default: SpotImagesMobile } = await import("./SpotImagesMobile")
const photos = [{ cloudinary_public_id: "a", is_main: true }, { cloudinary_public_id: "b", is_main: false }, { cloudinary_public_id: "c", is_main: false }]

describe("fotos del lugar en el celular", () => {
  it("todas, la principal primero y con prioridad, con 1/n encima", () => {
    render(<SpotImagesMobile images={photos} name="Cerro" />)
    const imgs = screen.getAllByRole("img")
    expect(imgs.map(i => i.getAttribute("aria-label"))).toEqual(["Cerro 1", "Cerro 2", "Cerro 3"])
    expect(imgs.map(i => i.getAttribute("data-priority"))).toEqual(["si", "no", "no"])
    expect(screen.getByText("1/3")).toBeTruthy()
  })

  it("al deslizar cambia el número, y al tocar se abre esa foto en grande", () => {
    const { container } = render(<SpotImagesMobile images={photos} name="Cerro" />)
    const track = container.querySelector(".spot-mobile-photos-track") as HTMLDivElement
    Object.defineProperty(track, "clientWidth", { value: 390 })
    track.scrollLeft = 780
    fireEvent.scroll(track)
    expect(screen.getByText("3/3")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Ver foto 2 de Cerro" }))
    expect(screen.getByRole("dialog").textContent).toBe("foto 2")
  })

  it("a todo el ancho en el celular, y en la compu (donde está oculta) la versión más chica", () => {
    render(<SpotImagesMobile images={photos} name="Cerro" />)
    const sizes = new Set(screen.getAllByRole("img").map(i => i.getAttribute("data-sizes")))
    expect([...sizes]).toEqual(["(max-width: 768px) 100vw, 1px"])
  })

  it("sin fotos no muestra nada", () => {
    const { container } = render(<SpotImagesMobile images={[]} name="Cerro" />)
    expect(container.innerHTML).toBe("")
  })
})
