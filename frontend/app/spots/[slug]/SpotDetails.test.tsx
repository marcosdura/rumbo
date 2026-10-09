import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

// Página pública de un lugar: qué accesos para sumar contenido ve cada uno.
let session: { id_token: string } | null = null
let viewer = { is_owner: false, is_admin: false, pending: [] as { id: number; kind: string; title: string }[] }
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: session }) }))
let navigation: string[] = []
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: (url: string) => navigation.push(url), back: () => navigation.push("back") }),
  usePathname: () => "/spots/x",
}))
let views: { url: string; token: string | undefined }[] = []
let gets: string[] = []
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => { gets.push(url); return Promise.resolve({ data: url.endsWith("/viewer") ? viewer : { average: null, total: 0 } }) },
    post: (url: string, _body: unknown, opts: { token?: string }) => { views.push({ url, token: opts?.token }); return Promise.resolve({ data: null }) },
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
vi.mock("@/components/spot-detail/NearbySpots", () => ({ default: ({ spotId }: { spotId: number }) => <p>cercanos de {spotId}</p> }))

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

  it("cualquiera puede reportar el lugar, menos su dueño", async () => {
    render(<SpotDetail spot={spot("Camping")} />)
    expect(await screen.findByRole("button", { name: "⚑ Reportar este lugar" })).toBeTruthy()
  })

  it("el dueño no ve Reportar en su propio lugar", async () => {
    session = { id_token: "t" }
    viewer = { is_owner: true, is_admin: false, pending: [] }
    render(<SpotDetail spot={spot("Camping")} />)
    await screen.findByRole("link", { name: "Administrar →" })
    expect(screen.queryByRole("button", { name: "⚑ Reportar este lugar" })).toBeNull()
  })
})

describe("Página del lugar sugerido por un visitante", () => {
  it("avisa que está a confirmar y ofrece reclamarlo", async () => {
    render(<SpotDetail spot={spot("Camping", { suggested_by_visitor: true })} />)
    expect(await screen.findByText(/la información está a confirmar/)).toBeTruthy()
    expect(screen.getByRole("button", { name: "¿Sos el responsable o dueño? Reclamalo" })).toBeTruthy()
  })

  it("un lugar cargado por su responsable no muestra el aviso", async () => {
    render(<SpotDetail spot={spot("Camping")} />)
    await screen.findByText("Cerro Arequita")
    expect(screen.queryByText(/la información está a confirmar/)).toBeNull()
  })

  it("registra la visita al lugar, una vez", async () => {
    views = []
    render(<SpotDetail spot={spot("Camping")} />)
    await screen.findByText("Cerro Arequita")
    expect(views).toEqual([{ url: "/spots/12/view", token: undefined }])
  })
})

describe("Página del lugar: encabezado y panel", () => {
  it("el puntaje viene con el lugar, sin pedirlo aparte", async () => {
    gets = []
    render(<SpotDetail spot={spot("Camping", { average_rating: 4.6, review_count: 12 })} />)
    expect(await screen.findByText("4.6")).toBeTruthy()
    expect(screen.getByText("12 reseñas")).toBeTruthy()
    expect(gets.filter(u => u.includes("/reviews/"))).toEqual([])
  })

  it("avisa en el encabezado si está fuera de temporada", async () => {
    const month = new Date().getMonth() + 1
    const next = (month % 12) + 1
    // Temporada de un solo mes, el que viene: hoy está cerrado.
    render(<SpotDetail spot={spot("Camping", { season_start: next, season_end: next })} />)
    expect(await screen.findByText(/⚠️ Fuera de temporada · abre en/)).toBeTruthy()
  })

  it("el panel no repite departamento, categoría ni acceso", async () => {
    render(<SpotDetail spot={spot("Camping", { price: 450, is_public: false, pets_allowed: true })} />)
    await screen.findByText("Cerro Arequita")
    expect(screen.getByText("$450 / noche")).toBeTruthy()
    expect(screen.getByText("Acepta mascotas")).toBeTruthy()
    expect(screen.queryByText("Departamento")).toBeNull()
    expect(screen.queryByText("Categoría")).toBeNull()
    expect(screen.queryByText("🔒 Privado")).toBeNull()
  })
})

describe("Página del lugar: contacto y orden en el celular", () => {
  it("WhatsApp con mensaje; el email abre el correo y se puede copiar", async () => {
    render(<SpotDetail spot={spot("Camping", { whatsapp: "099 123 456", email: "hola@aguada.uy" })} />)
    await screen.findByText("Cerro Arequita")
    const wa = screen.getByRole("link", { name: /099 123 456/ }).getAttribute("href")!
    expect(new URL(wa).searchParams.get("text")).toBe("Hola, te escribo por Cerro Arequita, que vi en Rumbo.")
    expect(screen.getByRole("link", { name: "hola@aguada.uy" }).getAttribute("href")).toBe("mailto:hola@aguada.uy")
    expect(screen.getByRole("button", { name: "Copiar" })).toBeTruthy()
  })

  it("en el celular el panel de detalles va antes que la descripción", async () => {
    const { container } = render(<SpotDetail spot={spot("Camping")} />)
    await screen.findByText("Cerro Arequita")
    const css = Array.from(container.querySelectorAll("style")).map(s => s.textContent).join("")
    const mobile = css.slice(css.indexOf("@media (max-width: 768px)"))
    expect(mobile).toMatch(/\.spot-right-panel \{[^}]*order: -1;/)
  })
})

describe("Página del lugar: para seguir navegando", () => {
  it("las pills llevan a la búsqueda de la actividad y del departamento", async () => {
    render(<SpotDetail spot={spot("Camping", { categories: [{ id: 1, name: "Camping" }, { id: 2, name: "Trekking" }] })} />)
    await screen.findByText("Cerro Arequita")
    expect(screen.getByRole("link", { name: /Trekking/ }).getAttribute("href")).toBe("/search?activity=Trekking")
    expect(screen.getByRole("link", { name: "Lavalleja" }).getAttribute("href")).toBe("/search?department=Lavalleja")
  })

  it("muestra los cercanos del lugar", async () => {
    render(<SpotDetail spot={spot("Camping")} />)
    expect(await screen.findByText("cercanos de 12")).toBeTruthy()
  })

  it("← Volver: entrando por un link de afuera va a la búsqueda", async () => {
    navigation = []
    render(<SpotDetail spot={spot("Camping")} />)
    // Solo se ve en el celular (display: none en escritorio).
    fireEvent.click(await screen.findByText("← Volver"))
    expect(navigation).toEqual(["/search"])
  })
})
