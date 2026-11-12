import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import type { SavedPost } from "@/lib/blogEditor"

// Los mapas (Leaflet) no corren en jsdom.
vi.mock("next/dynamic", () => ({ default: () => function FakeMap() { return <div data-testid="map" /> } }))
vi.mock("next-cloudinary", () => ({ CldImage: () => null }))
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { id_token: "tok" }, status: "authenticated" }) }))
const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

const calls: { method: string; path: string; body?: unknown }[] = []
let previewError: Error | null = null
let stored: SavedPost
vi.mock("@/lib/api", async () => {
  const real = await vi.importActual<typeof import("@/lib/api")>("@/lib/api")
  const answer = (method: string, path: string, body?: unknown) => {
    calls.push({ method, path, body })
    if (path === "/admin/blog/preview") {
      if (previewError) return Promise.reject(previewError)
      return Promise.resolve({ data: { ...(body as object), spots: {}, related: [], missing_spots: [], reading_minutes: 1, points_count: 0, has_map: false } })
    }
    if (method === "POST" || method === "PUT") {
      const b = body as Partial<SavedPost>
      stored = { ...stored, ...b, id: 5, slug: b.slug || "travesia-de-refugios", published_at: b.status === "published" ? "2026-11-12T10:00:00Z" : null } as SavedPost
    }
    return Promise.resolve({ data: stored })
  }
  return {
    ...real,
    api: {
      get: (path: string) => answer("GET", path),
      post: (path: string, body: unknown) => answer("POST", path, body),
      put: (path: string, body: unknown) => answer("PUT", path, body),
      del: (path: string) => answer("DELETE", path),
    },
  }
})

const { default: BlogEditor } = await import("./BlogEditor")
const { ApiError } = await import("@/lib/api")

const fetchMock = vi.fn(async () => new Response("{}"))

beforeEach(() => {
  calls.length = 0
  previewError = null
  stored = {
    id: 5, slug: "refugios", title: "Refugios", summary: null, cover_image: null, category: "refugios",
    region: null, status: "draft", featured: false, published_at: null, updated_at: null, spots: {}, map: null,
    blocks: [{ type: "text", text: "Hola" }],
  }
  vi.stubGlobal("fetch", fetchMock)
})
afterEach(() => { vi.unstubAllGlobals(); fetchMock.mockClear() })

const saves = () => calls.filter(c => c.path.startsWith("/admin/blog/posts") && c.method !== "GET")

describe("El editor del blog", () => {
  it("una nota nueva: se escribe y se publica; el blog se refresca", async () => {
    render(<BlogEditor postId={null} />)
    fireEvent.change(screen.getByPlaceholderText("Travesía de refugios en Bariloche"), { target: { value: "Travesía de refugios" } })
    fireEvent.click(screen.getByRole("button", { name: "Contenido · 1" }))
    fireEvent.change(screen.getByRole("textbox", { name: "Texto" }), { target: { value: "Arrancamos en **Bariloche**." } })
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }))

    await screen.findByText(/¡Publicada!/)
    const [save] = saves()
    expect(save.method).toBe("POST")
    expect(save.body).toMatchObject({ title: "Travesía de refugios", status: "published", blocks: [{ type: "text", text: "Arrancamos en **Bariloche**." }] })
    expect(window.location.pathname).toBe("/admin/blog/5")
    expect(fetchMock).toHaveBeenCalledWith("/api/blog/revalidate", expect.objectContaining({ body: JSON.stringify({ slugs: ["travesia-de-refugios"] }) }))
    expect(screen.getByText("Publicada")).toBeTruthy()
  })

  it("lo que falta para guardar se ve arriba (lo dice la vista previa)", async () => {
    previewError = new ApiError(422, "Bloque 1: falta el texto")
    render(<BlogEditor postId={5} />)
    expect(await screen.findByText(/Falta algo para poder guardar: Bloque 1: falta el texto/, {}, { timeout: 2000 })).toBeTruthy()
  })

  it("un punto libre con coordenadas pegadas y su sección en el texto", async () => {
    render(<BlogEditor postId={5} />)
    await screen.findByRole("button", { name: /Mapa · 0/ })
    fireEvent.click(screen.getByRole("button", { name: /Mapa · 0/ }))
    fireEvent.change(screen.getByLabelText("Nombre del punto"), { target: { value: "Refugio Frey" } })
    fireEvent.change(screen.getByLabelText("Coordenadas del punto"), { target: { value: "-41.18, -71.47" } })
    fireEvent.click(screen.getByRole("button", { name: "+ Agregar punto" }))
    expect(screen.getByRole("button", { name: "🛖 Refugio Frey", expanded: true })).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Contenido · 1" }))
    fireEvent.click(within(screen.getByRole("group", { name: "Agregar un bloque" })).getByRole("button", { name: "+ Punto del mapa" }))
    fireEvent.change(screen.getByRole("textbox", { name: "Texto del punto" }), { target: { value: "Cuatro horas de subida." } })
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }))

    await screen.findByText(/Guardado/)
    const [save] = saves()
    expect(save.method).toBe("PUT")
    expect(save.path).toBe("/admin/blog/posts/5")
    expect(save.body).toMatchObject({
      status: "draft",
      map: { points: [{ id: "refugio-frey", name: "Refugio Frey", type: "refugio", lat: -41.18, lng: -71.47 }], tracks: [] },
      blocks: [{ type: "text", text: "Hola" }, { type: "point", point: "refugio-frey", text: "Cuatro horas de subida." }],
    })
    // Un borrador no toca el caché del blog.
    expect(fetchMock).not.toHaveBeenCalledWith("/api/blog/revalidate", expect.anything())
  })

  it("borrar pide confirmación y vuelve a la lista", async () => {
    render(<BlogEditor postId={5} />)
    fireEvent.click(await screen.findByRole("button", { name: "Borrar nota" }))
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Borrar" }))
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin?tab=blog"))
    expect(calls.some(c => c.method === "DELETE" && c.path === "/admin/blog/posts/5")).toBe(true)
  })
})
