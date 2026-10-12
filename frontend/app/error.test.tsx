import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

vi.mock("@/components/layout/Footer", () => ({ default: () => <footer>footer</footer> }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => <nav>navbar</nav> }))

const { default: ErrorPage } = await import("./error")

describe("Pantalla de error", () => {
  it("en español, con navbar y footer, y Reintentar vuelve a pedir la página", () => {
    let retries = 0
    render(<ErrorPage error={new Error("Error 502")} unstable_retry={() => { retries++ }} />)
    expect(screen.getByRole("heading", { name: "Algo salió mal" })).toBeTruthy()
    expect(screen.getByText("navbar")).toBeTruthy()
    expect(screen.getByText("footer")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(retries).toBe(1)
    expect(screen.getByRole("link", { name: "Ir al inicio" }).getAttribute("href")).toBe("/")
  })

  it("no muestra el mensaje técnico del error", () => {
    render(<ErrorPage error={new Error("Error 502")} unstable_retry={() => {}} />)
    expect(screen.queryByText(/502/)).toBeNull()
  })
})
