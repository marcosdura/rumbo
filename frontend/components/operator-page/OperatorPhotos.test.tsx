import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// La foto simulada deja ver cuál se pidió con prioridad.
vi.mock("@/components/spot-detail/CloudinaryPhoto", () => ({
  default: ({ alt, priority }: { alt: string; priority?: boolean }) => <img alt={alt} data-priority={String(!!priority)} />,
}))
vi.mock("@/components/spot-detail/PhotoLightbox", () => ({ default: () => null }))

const { default: OperatorPhotos } = await import("./OperatorPhotos")

describe("Fotos de escuelas y servicios", () => {
  it("solo la principal carga con prioridad", () => {
    render(<OperatorPhotos photos={["a", "b", "c"]} name="Escuela Ola" />)
    expect(screen.getAllByRole("img").map(i => i.dataset.priority)).toEqual(["true", "false", "false"])
  })

  it("con dos fotos, también solo la primera", () => {
    render(<OperatorPhotos photos={["a", "b"]} name="Escuela Ola" />)
    expect(screen.getAllByRole("img").map(i => i.dataset.priority)).toEqual(["true", "false"])
  })
})
