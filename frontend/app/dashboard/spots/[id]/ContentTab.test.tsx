import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { OwnerContent } from "./types"

// API simulada con funciones comunes, no vi.fn (ver
// components/agregar-lugar/submit.test.ts: Vitest 4 reporta mal las
// promesas rechazadas de un vi.fn).
let content: OwnerContent
let postResponse: { is_approved: boolean }
let posts: [string, unknown][] = []
let deletes: string[] = []
let edits: [string, string, unknown][] = []
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error { status = 0 },
  api: {
    get: () => Promise.resolve({ data: content }),
    post: (url: string, body: unknown) => { posts.push([url, body]); return Promise.resolve({ data: postResponse }) },
    del: (url: string) => { deletes.push(url); return Promise.resolve({ data: {} }) },
    patch: (url: string, body: unknown) => { edits.push(["patch", url, body]); return Promise.resolve({ data: {} }) },
    put: (url: string, body: unknown) => { edits.push(["put", url, body]); return Promise.resolve({ data: {} }) },
  },
}))

const { default: ContentTab, savedMessage } = await import("./ContentTab")

beforeEach(() => {
  content = {
    experiences: [
      { id: 1, title: "Cabalgata", price: 900, is_approved: true, category: { name: "Trekking" } },
      { id: 2, title: "Pesca nocturna", price: null, is_approved: false, category: { name: "Kayak" } },
    ],
    glamping_units: [
      { id: 7, accommodation_type: "domo", capacity: 2, price_per_night: 3500, min_nights: 1, is_approved: false },
    ],
    routes: [{ id: 21, name: "Sendero al mirador", distance_km: 6, difficulty: "moderado", is_approved: true }],
    sectors: [
      { id: 31, name: "Sector Norte", type: "deportiva", is_approved: true, routes: [
        { id: 41, name: "La Diagonal", grade: "6a", is_approved: true },
        { id: 42, name: "Vía sugerida", grade: "7a", is_approved: false },
      ] },
      { id: 32, name: "Sector sugerido", type: null, is_approved: false, routes: [] },
    ],
    surf_schools: [{ id: 51, name: "Escuela Ola", is_approved: false }],
    kayaks: [],
  }
  postResponse = { is_approved: false }
  posts = []
  deletes = []
})

function renderTab(showGlamping = true, category = "Glamping") {
  const stay = ["Camping", "Glamping", "Motorhome"].includes(category)
  render(<ContentTab spotId={5} token="t" reviewed category={category} showExperiences={stay} showGlamping={showGlamping} />)
}

describe("ContentTab", () => {
  it("lista lo existente y marca lo que está en revisión", async () => {
    renderTab()
    expect(await screen.findByText("Cabalgata")).toBeTruthy()
    expect(screen.getByText("Pesca nocturna")).toBeTruthy()
    expect(screen.getByText("Domo")).toBeTruthy()
    expect(screen.getAllByText("En revisión")).toHaveLength(2)
  })

  it("sin glamping no muestra la sección de alojamiento", async () => {
    renderTab(false, "Camping")
    await screen.findByText("Cabalgata")
    expect(screen.queryByText("Tipos de alojamiento")).toBeNull()
  })

  it("no guarda una experiencia incompleta", async () => {
    renderTab()
    await screen.findByText("Cabalgata")
    fireEvent.click(screen.getByRole("button", { name: "＋ Agregar experiencia" }))
    fireEvent.click(screen.getByRole("button", { name: "Guardar experiencias" }))
    expect(await screen.findByText("Completá la categoría y el título de cada experiencia.")).toBeTruthy()
    expect(posts).toHaveLength(0)
  })

  it("guarda una experiencia nueva y avisa que queda en revisión", async () => {
    renderTab()
    await screen.findByText("Cabalgata")
    fireEvent.click(screen.getByRole("button", { name: "＋ Agregar experiencia" }))
    fireEvent.click(screen.getByRole("button", { name: /Surf/ }))
    fireEvent.change(screen.getByPlaceholderText("Ej: Trekking al Cerro Grande"), { target: { value: "Clase de surf" } })
    fireEvent.click(screen.getByRole("button", { name: "Guardar experiencias" }))
    expect(await screen.findByText("✓ Guardado. Queda en revisión hasta que el equipo de Rumbo lo apruebe.")).toBeTruthy()
    expect(posts).toEqual([["/spots/5/experiences", expect.objectContaining({ category_id: 4, title: "Clase de surf" })]])
  })

  it("una unidad de glamping incompleta no se guarda", async () => {
    renderTab()
    await screen.findByText("Cabalgata")
    fireEvent.click(screen.getByRole("button", { name: "＋ Agregar tipo de alojamiento" }))
    fireEvent.click(screen.getByRole("button", { name: "Guardar alojamientos" }))
    expect(await screen.findByText("Seleccioná un tipo de alojamiento")).toBeTruthy()
    expect(posts).toHaveLength(0)
  })

  it("borrar algo en revisión avisa que se retira", async () => {
    renderTab()
    await screen.findByText("Cabalgata")
    fireEvent.click(screen.getByRole("button", { name: "Eliminar Pesca nocturna" }))
    expect(screen.getByText("Todavía está en revisión: se retira y no se publica.")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }))
    await waitFor(() => expect(deletes).toEqual(["/spots/5/experiences/2"]))
  })

  it("borrar un alojamiento usa su endpoint", async () => {
    renderTab()
    await screen.findByText("Domo")
    fireEvent.click(screen.getByRole("button", { name: "Eliminar Domo" }))
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }))
    await waitFor(() => expect(deletes).toEqual(["/glamping/glamping/7"]))
  })
})

describe("savedMessage", () => {
  it("distingue revisión de publicado", () => {
    expect(savedMessage([{ is_approved: false }])).toMatch(/revisión/)
    expect(savedMessage([{ is_approved: true }])).toBe("✓ Guardado correctamente")
  })
})

describe("ContentTab según el tipo de lugar", () => {
  it("trekking: rutas, sin experiencias, con acceso a sumar", async () => {
    renderTab(false, "Trekking")
    expect(await screen.findByText("Sendero al mirador")).toBeTruthy()
    expect(screen.queryByText("Experiencias")).toBeNull()
    expect(screen.getByRole("link", { name: "＋ Agregar una ruta" }).getAttribute("href")).toBe("/agregar-lugar?sumar=ruta&spot=5")
    fireEvent.click(screen.getByRole("button", { name: "Eliminar Sendero al mirador" }))
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }))
    await waitFor(() => expect(deletes).toEqual(["/routes/21"]))
  })

  it("escalada: sectores con sus vías, lo pendiente marcado", async () => {
    renderTab(false, "Escalada")
    expect(await screen.findByText("Sector Norte")).toBeTruthy()
    expect(screen.getByText("La Diagonal")).toBeTruthy()
    expect(screen.getAllByText("En revisión")).toHaveLength(2)  // la vía sugerida y el sector sugerido
    expect(screen.getByRole("link", { name: "＋ Agregar una vía a Sector Norte" }).getAttribute("href"))
      .toBe("/agregar-lugar?sumar=via&spot=5&sector=31")
    // A un sector en revisión no se le ofrece sumar vías.
    expect(screen.queryByRole("link", { name: "＋ Agregar una vía a Sector sugerido" })).toBeNull()
  })

  it("borrar un sector avisa que se van sus vías", async () => {
    renderTab(false, "Escalada")
    fireEvent.click(await screen.findByRole("button", { name: "Eliminar Sector Norte" }))
    expect(screen.getByText("Se borran también sus 2 vías. No se puede deshacer.")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }))
    await waitFor(() => expect(deletes).toEqual(["/sectors/31"]))
  })

  it("borrar una vía usa su endpoint", async () => {
    renderTab(false, "Escalada")
    fireEvent.click(await screen.findByRole("button", { name: "Eliminar La Diagonal" }))
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }))
    await waitFor(() => expect(deletes).toEqual(["/climbingroutes/41"]))
  })

  it("surf: escuelas", async () => {
    renderTab(false, "Surf")
    expect(await screen.findByText("Escuela Ola")).toBeTruthy()
    expect(screen.getByRole("link", { name: "＋ Agregar una escuela" }).getAttribute("href")).toBe("/agregar-lugar?sumar=surf&spot=5")
  })
})


describe("ContentTab: corregir lo ya cargado (al instante)", () => {
  beforeEach(() => { edits = [] })

  it("editar una ruta manda solo sus datos y cierra el formulario", async () => {
    render(<ContentTab spotId={3} token="t" reviewed category="Trekking" showExperiences={false} showGlamping={false} />)
    fireEvent.click(await screen.findByRole("button", { name: "Editar Sendero al mirador" }))
    fireEvent.change(screen.getByLabelText("Distancia (km)"), { target: { value: "7.5" } })
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(edits).toHaveLength(1))
    expect(edits[0][0]).toBe("patch")
    expect(edits[0][1]).toBe("/routes/21")
    expect(edits[0][2]).toMatchObject({ name: "Sendero al mirador", distance_km: 7.5, difficulty: "moderado" })
    expect(await screen.findByText("✓ Sendero al mirador: guardado")).toBeTruthy()
    expect(screen.queryByLabelText("Distancia (km)")).toBeNull()
  })

  it("una ruta sin nombre no se guarda", async () => {
    render(<ContentTab spotId={3} token="t" reviewed category="Trekking" showExperiences={false} showGlamping={false} />)
    fireEvent.click(await screen.findByRole("button", { name: "Editar Sendero al mirador" }))
    fireEvent.change(screen.getByLabelText("Nombre de la ruta"), { target: { value: " " } })
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    expect(screen.getByRole("alert").textContent).toBe("La ruta tiene que tener nombre.")
    expect(edits).toEqual([])
  })

  it("características del trekking", async () => {
    content.trekking_detail = { bathrooms: true }
    render(<ContentTab spotId={3} token="t" reviewed category="Trekking" showExperiences={false} showGlamping={false} />)
    fireEvent.click(await screen.findByRole("button", { name: "Guardar características" }))
    await waitFor(() => expect(edits).toHaveLength(1))
    expect(edits[0][1]).toBe("/spots/3/trekking-detail")
    expect(edits[0][2]).toMatchObject({ bathrooms: true, fire_pits: null })
  })

  it("servicios del camping: quedan los elegidos", async () => {
    content.amenity_ids = [22]
    render(<ContentTab spotId={3} token="t" reviewed category="Camping" showExperiences showGlamping={false} activities={["Camping"]} />)
    fireEvent.click(await screen.findByRole("button", { name: "Ducha" }))
    fireEvent.click(screen.getByRole("button", { name: "WiFi" }))
    fireEvent.click(screen.getByRole("button", { name: "Guardar servicios" }))
    await waitFor(() => expect(edits).toHaveLength(1))
    expect(edits[0]).toEqual(["put", "/spots/3/camping-amenities", { amenity_ids: [1] }])
  })

  it("servicios para motorhomes, solo si el lugar es de motorhome", async () => {
    render(<ContentTab spotId={3} token="t" reviewed category="Camping" showExperiences showGlamping={false} activities={["Camping"]} />)
    await screen.findByText("Servicios del camping")
    expect(screen.queryByText("Servicios para motorhomes")).toBeNull()
  })

  it("editar un alojamiento de glamping", async () => {
    render(<ContentTab spotId={3} token="t" reviewed category="Glamping" showExperiences showGlamping activities={["Glamping"]} />)
    fireEvent.click(await screen.findByRole("button", { name: "Editar Domo" }))
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(edits).toHaveLength(1))
    expect(edits[0]).toEqual(["patch", "/glamping/units/7", { accommodation_type: "domo", capacity: 2, price_per_night: 3500, min_nights: 1 }])
  })

  it("editar una experiencia no manda la categoría", async () => {
    render(<ContentTab spotId={3} token="t" reviewed category="Camping" showExperiences showGlamping={false} activities={["Camping"]} />)
    fireEvent.click(await screen.findByRole("button", { name: "Editar Cabalgata" }))
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(edits).toHaveLength(1))
    expect(edits[0][1]).toBe("/spots/3/experiences/1")
    expect(edits[0][2]).not.toHaveProperty("category_id")
    expect(edits[0][2]).toMatchObject({ title: "Cabalgata", price: 900 })
  })
})
