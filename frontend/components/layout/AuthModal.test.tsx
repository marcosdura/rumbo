import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

let signIns = 0
vi.mock("@/lib/auth", () => ({ signInWithGoogle: () => { signIns++ } }))

const AuthModal = (await import("./AuthModal")).default
const { takePendingAction } = await import("@/lib/pendingAction")

afterEach(() => { signIns = 0; sessionStorage.clear() })

describe("Modal de login", () => {
  it("ya no ofrece 'mantener sesión iniciada' (cerraba la sesión al recargar)", () => {
    render(<AuthModal onClose={() => {}} />)
    expect(screen.queryByRole("checkbox")).toBeNull()
    expect(screen.queryByText(/Mantener sesión/)).toBeNull()
    expect(screen.getByRole("heading", { name: "Iniciá sesión" })).toBeTruthy()
  })

  it("dice para qué hace falta la sesión", () => {
    render(<AuthModal onClose={() => {}} reason="guardar este lugar en favoritos" />)
    expect(screen.getByRole("heading", { name: "Iniciá sesión para guardar este lugar en favoritos" })).toBeTruthy()
  })

  it("guarda la acción pendiente antes de ir a Google, para hacerla al volver", () => {
    render(<AuthModal onClose={() => {}} pending={{ kind: "favorite", spotId: 12 }} />)
    fireEvent.click(screen.getByRole("button", { name: "Continuar con Google" }))
    expect(signIns).toBe(1)
    expect(takePendingAction("favorite")).toEqual({ kind: "favorite", spotId: 12 })
  })

  it("sin acción pendiente no guarda nada", () => {
    render(<AuthModal onClose={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: "Continuar con Google" }))
    expect(takePendingAction("favorite")).toBeNull()
  })
})
