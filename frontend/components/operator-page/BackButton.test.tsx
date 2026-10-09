import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

// Router simulado con valores comunes, no vi.fn.
const navigation: string[] = []
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: (url: string) => navigation.push(url), back: () => navigation.push("back") }),
}))

const { default: BackButton } = await import("./BackButton")

describe("← Volver en escuelas y servicios", () => {
  it("entrando por un link de afuera, va a la playa", () => {
    render(<BackButton fallback="/spots/playa-brava" />)
    fireEvent.click(screen.getByRole("button", { name: "← Volver" }))
    expect(navigation).toEqual(["/spots/playa-brava"])
  })
})
