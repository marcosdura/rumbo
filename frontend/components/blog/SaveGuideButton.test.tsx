import { afterEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"

let session: { id_token: string } | null = { id_token: "tok" }
let saved: unknown[] = []
const calls: string[] = []
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: session }) }))
vi.mock("@/lib/api", () => ({
  api: {
    get: async () => ({ data: saved }),
    post: async (p: string) => { calls.push(`POST ${p}`); return { data: { saved: true } } },
    del: async (p: string) => { calls.push(`DELETE ${p}`); return { data: { saved: false } } },
  },
}))
vi.mock("@/components/layout/AuthModal", () => ({
  default: ({ reason, pending }: { reason: string; pending: unknown }) => <div role="dialog" data-pending={JSON.stringify(pending)}>{reason}</div>,
}))

const { default: SaveGuideButton } = await import("./SaveGuideButton")
const { useSavedGuidesStore } = await import("@/store/savedGuidesStore")

const post = {
  slug: "refugios", title: "Refugios", summary: null, cover_image: null, category: "refugios" as const, region: null,
  featured: false, published_at: "2026-11-01T12:00:00Z", updated_at: null, reading_minutes: 4, points_count: 3, has_map: true,
}

afterEach(() => {
  // Antes de tocar el store: con el botón montado, volvería a pedir la lista.
  cleanup()
  session = { id_token: "tok" }; saved = []; calls.length = 0
  useSavedGuidesStore.setState({ guides: [], loadedFor: null, loading: false })
})

describe("Guardar esta guía", () => {
  it("la guarda en las guías (no en los favoritos de lugares) y se puede sacar", async () => {
    render(<SaveGuideButton post={post} />)
    await act(() => Promise.resolve())
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Guardar" })) })
    expect(calls).toEqual(["POST /blog/posts/refugios/save"])
    expect(screen.getByRole("button", { name: "Guardada" }).getAttribute("aria-pressed")).toBe("true")

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Guardada" })) })
    expect(calls.at(-1)).toBe("DELETE /blog/posts/refugios/save")
    expect(screen.getByRole("button", { name: "Guardar" })).toBeTruthy()
  })

  it("si ya la tenía guardada, lo muestra", async () => {
    saved = [post]
    render(<SaveGuideButton post={post} />)
    expect(await screen.findByRole("button", { name: "Guardada" })).toBeTruthy()
  })

  it("solo el ícono (el celular), con su nombre para lectores de pantalla", async () => {
    saved = [post]
    render(<SaveGuideButton post={post} icon />)
    expect(await screen.findByRole("button", { name: "Guía guardada" })).toBeTruthy()
  })

  it("sin sesión pide entrar y la guarda al volver", () => {
    session = null
    render(<SaveGuideButton post={post} />)
    fireEvent.click(screen.getByRole("button"))
    const modal = screen.getByRole("dialog")
    expect(modal.textContent).toBe("guardar esta guía")
    expect(JSON.parse(modal.dataset.pending!)).toEqual({ kind: "guide", slug: "refugios" })
    expect(calls).toEqual([])
  })
})
