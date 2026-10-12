import { afterEach, describe, expect, it, vi } from "vitest"
import { act, render } from "@testing-library/react"

// Al volver del login con un ❤️ pendiente: se guarda y después se cargan
// los favoritos (que ya lo traen).
const events: string[] = []
vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({ data: { id_token: "t", termsAcceptedAt: "2026-01-01" }, status: "authenticated", update: () => {} }),
  signOut: () => {},
}))
vi.mock("@/lib/api", () => ({
  api: {
    post: (url: string) => { events.push(`post ${url}`); return Promise.resolve({ data: null }) },
    patch: () => Promise.resolve({ data: null }),
  },
}))
vi.mock("@/store/favoritesStore", () => ({ useFavoritesStore: () => ({ loadFavorites: () => { events.push("load") } }) }))
vi.mock("@/lib/analytics", () => ({ trackEvent: () => {} }))

const { default: Providers } = await import("./Providers")
const { savePendingAction } = await import("@/lib/pendingAction")

afterEach(() => { events.length = 0; sessionStorage.clear() })

describe("Providers", () => {
  it("con un favorito pendiente del login, lo guarda y después carga los favoritos", async () => {
    savePendingAction({ kind: "favorite", spotId: 12 })
    render(<Providers><div /></Providers>)
    await act(() => Promise.resolve())
    expect(events).toEqual(["post /favorites/12", "load"])
  })

  it("sin nada pendiente, solo carga los favoritos", async () => {
    render(<Providers><div /></Providers>)
    await act(() => Promise.resolve())
    expect(events).toEqual(["load"])
  })
})
