import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

// API simulada con funciones comunes, no vi.fn (ver
// components/agregar-lugar/submit.test.ts).
class FakeApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
let session: { id_token: string } | null = { id_token: "t" }
let postResult: () => Promise<unknown> = () => Promise.resolve({ data: { ok: true } })
let posts: unknown[] = []
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: session }) }))
vi.mock("@/components/layout/AuthModal", () => ({ default: () => <p>Pantalla de login</p> }))
vi.mock("@/lib/api", () => ({
  ApiError: FakeApiError,
  api: {
    get: () => Promise.resolve({ data: [
      { value: "false_info", label: "Información falsa o engañosa" },
      { value: "offensive", label: "Contenido ofensivo o inapropiado" },
      { value: "other", label: "Otro" },
    ] }),
    post: (_url: string, body: unknown) => { posts.push(body); return postResult() },
  },
}))

const { default: ReportButton } = await import("./ReportButton")

afterEach(() => {
  session = { id_token: "t" }
  postResult = () => Promise.resolve({ data: { ok: true } })
  posts = []
})

function open() {
  render(<ReportButton targetKind="review" targetId={7} what="esta reseña" />)
  fireEvent.click(screen.getByRole("button", { name: "Reportar" }))
}

describe("ReportButton", () => {
  it("sin sesión pide el login", () => {
    session = null
    open()
    expect(screen.getByText("Pantalla de login")).toBeTruthy()
    expect(screen.queryByText("Reportar esta reseña")).toBeNull()
  })

  it("reporta con el motivo elegido y agradece", async () => {
    open()
    fireEvent.click(await screen.findByLabelText("Contenido ofensivo o inapropiado"))
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }))
    expect(await screen.findByText("✓ Gracias, lo vamos a revisar")).toBeTruthy()
    expect(posts).toEqual([{ target_kind: "review", target_id: 7, reason: "offensive", comment: null }])
  })

  it("sin motivo no envía", async () => {
    open()
    await screen.findByLabelText("Otro")
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }))
    expect(screen.getByText("Elegí un motivo.")).toBeTruthy()
    expect(posts).toHaveLength(0)
  })

  it("\"otro\" pide comentario", async () => {
    open()
    fireEvent.click(await screen.findByLabelText("Otro"))
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }))
    expect(screen.getByText("Contanos qué pasa.")).toBeTruthy()
    expect(posts).toHaveLength(0)
  })

  it("si ya lo reportó, muestra el aviso del backend", async () => {
    postResult = () => Promise.reject(new FakeApiError(409, "Ya lo reportaste: lo estamos revisando."))
    open()
    fireEvent.click(await screen.findByLabelText("Información falsa o engañosa"))
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }))
    expect(await screen.findByText("Ya lo reportaste: lo estamos revisando.")).toBeTruthy()
    await waitFor(() => expect(screen.queryByText("✓ Gracias, lo vamos a revisar")).toBeNull())
  })
})
