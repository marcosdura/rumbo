import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

let calls: unknown[] = []
vi.mock("@/lib/auth", () => ({ signInWithGoogle: (o: unknown) => { calls.push(o) } }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/layout/Footer", () => ({ default: () => null }))

const { default: LoginRequired } = await import("./LoginRequired")

describe("Página de tu cuenta sin sesión", () => {
  it("pide iniciar sesión y vuelve a la misma página", () => {
    window.history.pushState({}, "", "/notificaciones?x=1")
    render(<LoginRequired page="Notificaciones" />)
    expect(screen.getByText(/«Notificaciones» es parte de tu cuenta/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Continuar con Google" }))
    expect(calls).toEqual([{ callbackUrl: `${window.location.origin}/notificaciones?x=1` }])
    expect(screen.getByRole("link", { name: "Términos y condiciones" }).getAttribute("href")).toBe("/legal#terminos")
    calls = []
  })
})
