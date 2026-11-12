import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

let session: { id_token: string } | null = { id_token: "tok" }
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: session }) }))
const post = vi.fn(async () => ({ data: { added: 2, saved: 2 } }))
vi.mock("@/lib/api", () => ({ api: { post: (...a: unknown[]) => post(...(a as [])) } }))
const favorites = new Set<number>()
const loadFavorites = vi.fn(async () => {})
vi.mock("@/store/favoritesStore", () => ({ useFavoritesStore: () => ({ isFavorite: (id: number) => favorites.has(id), loadFavorites }) }))
vi.mock("@/components/layout/AuthModal", () => ({
  default: ({ reason, pending }: { reason: string; pending: unknown }) => <div role="dialog" data-pending={JSON.stringify(pending)}>{reason}</div>,
}))

const { default: SaveAllButton } = await import("./SaveAllButton")

afterEach(() => { session = { id_token: "tok" }; favorites.clear(); post.mockClear() })

describe("Guardar todos los lugares de una nota", () => {
  it("los guarda de una y lleva a favoritos", async () => {
    render(<SaveAllButton spotIds={[3, 7]} slug="lavalleja" />)
    fireEvent.click(screen.getByRole("button", { name: "❤️ Guardar los 2 lugares de Rumbo" }))
    expect(await screen.findByRole("link", { name: "Ver favoritos" })).toBeTruthy()
    expect(post).toHaveBeenCalledWith("/favorites/bulk", { spot_ids: [3, 7] }, { token: "tok" })
    expect(loadFavorites).toHaveBeenCalledWith("tok")
  })

  it("sin sesión pide entrar y los guarda al volver", () => {
    session = null
    render(<SaveAllButton spotIds={[3, 7]} slug="lavalleja" />)
    fireEvent.click(screen.getByRole("button"))
    const modal = screen.getByRole("dialog")
    expect(modal.textContent).toBe("guardar estos lugares en favoritos")
    expect(JSON.parse(modal.dataset.pending!)).toEqual({ kind: "favorites", spotIds: [3, 7] })
    expect(post).not.toHaveBeenCalled()
  })

  it("si ya están todos guardados, lo dice; sin lugares, no aparece", () => {
    favorites.add(3).add(7)
    const { container, rerender } = render(<SaveAllButton spotIds={[3, 7]} slug="x" />)
    expect(container.textContent).toContain("Están en tus favoritos")
    rerender(<SaveAllButton spotIds={[]} slug="x" />)
    expect(container.textContent).toBe("")
  })
})
