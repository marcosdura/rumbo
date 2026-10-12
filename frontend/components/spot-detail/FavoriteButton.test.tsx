import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

let modalProps: Record<string, unknown> | null = null
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: null, status: "unauthenticated" }) }))
vi.mock("@/store/favoritesStore", () => ({
  useFavoritesStore: () => ({ isFavorite: () => false, addFavorite: () => {}, removeFavorite: () => {} }),
}))
vi.mock("@/components/layout/AuthModal", () => ({ default: (p: Record<string, unknown>) => { modalProps = p; return null } }))

const FavoriteButton = (await import("./FavoriteButton")).default as unknown as (p: { spot: { id: number } }) => React.ReactElement

describe("Favorito sin sesión", () => {
  it("pide iniciar sesión diciendo para qué, y lo deja pendiente para guardarlo al volver", () => {
    render(<FavoriteButton spot={{ id: 12 }} />)
    fireEvent.click(screen.getByRole("button"))
    expect(modalProps).toMatchObject({ reason: "guardar este lugar en favoritos", pending: { kind: "favorite", spotId: 12 } })
  })
})
