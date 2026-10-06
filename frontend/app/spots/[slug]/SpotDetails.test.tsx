import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// Página pública de un lugar: qué accesos para sumar contenido ve cada uno.
let session: { id_token: string } | null = null
let viewer = { is_owner: false, is_admin: false, pending: [] as { id: number; kind: string; title: string }[] }
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: session }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {}, back: () => {} }), usePathname: () => "/spots/x" }))
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => Promise.resolve({ data: url.endsWith("/viewer") ? viewer : { average: null, total: 0 } }),
  },
}))
// Lo pesado de la página (mapa, galería, navbar, reseñas) no importa acá.
vi.mock("next/dynamic", () => ({ default: () => () => null }))
vi.mock("next-cloudinary", () => ({ CldImage: () => null }))
vi.mock("../../../components/layout/Navbar", () => ({ default: () => null }))
vi.mock("../../../components/layout/Footer", () => ({ default: () => null }))
vi.mock("../../../components/spot-detail/SpotImages", () => ({ default: () => null }))
vi.mock("@/components/spot-detail/ReviewsSection", () => ({ default: () => null }))
vi.mock("@/components/spot-detail/FavoriteButton", () => ({ default: () => null }))
vi.mock("../../../components/spot-detail/ExperienciasSection", () => ({ default: () => null }))

const { default: SpotDetail } = await import("./SpotDetails")

function spot(category: string, extra: Record<string, unknown> = {}) {
  return {
    id: 12, name: "Cerro Arequita", slug: "cerro-arequita", description: "", department: "Lavalleja",
    category: { name: category }, images: [], routes: [], climbing_sectors: [], kayak_detail: [], surf_schools: [],
    ...extra,
  }
}

afterEach(() => {
  session = null
  viewer = { is_owner: false, is_admin: false, pending: [] }
})

describe("Página del lugar: accesos para sumar contenido", () => {
  it("escalada sin sectores invita a sugerir uno, aun sin sesión", async () => {
    render(<SpotDetail spot={spot("Escalada")} />)
    const link = await screen.findByRole("link", { name: "＋ Sugerir un sector" })
    expect(link.getAttribute("href")).toBe("/agregar-lugar?sumar=sector&spot=12")
  })

  it("escalada con sectores también ofrece sugerir", async () => {
    render(<SpotDetail spot={spot("Escalada", { climbing_sectors: [{ id: 1, name: "Norte", slug: "norte", routes_count: 0 }] })} />)
    expect(await screen.findByRole("link", { name: "＋ Sugerir un sector" })).toBeTruthy()
  })

  it("trekking: sumar rutas solo lo ve el dueño", async () => {
    render(<SpotDetail spot={spot("Trekking")} />)
    await screen.findByText("Cerro Arequita")
    expect(screen.queryByRole("link", { name: "＋ Agregar una ruta" })).toBeNull()
  })

  it("el dueño ve Administrar y Agregar una ruta", async () => {
    session = { id_token: "t" }
    viewer = { is_owner: true, is_admin: false, pending: [] }
    render(<SpotDetail spot={spot("Trekking")} />)
    expect((await screen.findByRole("link", { name: "Administrar →" })).getAttribute("href")).toBe("/dashboard/spots/12")
    expect(screen.getByRole("link", { name: "＋ Agregar una ruta" }).getAttribute("href")).toBe("/agregar-lugar?sumar=ruta&spot=12")
  })

  it("el autor ve sus aportes en revisión en ese lugar", async () => {
    session = { id_token: "t" }
    viewer = { is_owner: false, is_admin: false, pending: [{ id: 3, kind: "climbing_sector", title: "Sector Norte" }] }
    render(<SpotDetail spot={spot("Escalada")} />)
    expect(await screen.findByText(/Tenés en revisión en este lugar: Sector Norte \(sector de escalada\)/)).toBeTruthy()
    expect(screen.queryByRole("link", { name: "Administrar →" })).toBeNull()
  })

  it("surf: cualquiera puede sumar su escuela, aunque la playa no tenga ninguna", async () => {
    render(<SpotDetail spot={spot("Surf")} />)
    const link = await screen.findByRole("link", { name: "＋ Sumar tu escuela de surf" })
    expect(link.getAttribute("href")).toBe("/agregar-lugar?sumar=surf&spot=12")
  })

  it("kayak con servicios también ofrece sumar", async () => {
    render(<SpotDetail spot={spot("Kayak", { kayak_detail: [{ id: 1, name: "Kayak Laguna" }] })} />)
    expect(await screen.findByRole("link", { name: "＋ Sumar tu servicio de kayak" })).toBeTruthy()
  })
})
