import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"

// API simulada con funciones comunes, no vi.fn (ver
// components/agregar-lugar/submit.test.ts).
let session: { id_token: string } | null = { id_token: "t" }
let pending = false
let posts: { url: string; body: unknown }[] = []
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: session }) }))
vi.mock("@/components/layout/AuthModal", () => ({ default: () => <p>modal de login</p> }))
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  api: {
    get: () => Promise.resolve({ data: { pending } }),
    post: (url: string, body: unknown) => { posts.push({ url, body }); return Promise.resolve({ data: { id: 1 } }) },
  },
}))

const { default: SuggestedNotice } = await import("./SuggestedNotice")

afterEach(() => {
  session = { id_token: "t" }
  pending = false
  posts = []
})

const flush = () => act(() => Promise.resolve())
const CLAIM = "¿Sos el responsable o dueño? Reclamalo"

describe("SuggestedNotice", () => {
  it("avisa que la información está a confirmar", async () => {
    render(<SuggestedNotice spotId={7} />)
    await flush()
    expect(screen.getByText(/la información está a confirmar/)).toBeTruthy()
  })

  it("sin sesión, reclamar pide iniciarla", async () => {
    session = null
    render(<SuggestedNotice spotId={7} />)
    fireEvent.click(screen.getByRole("button", { name: CLAIM }))
    expect(screen.getByText("modal de login")).toBeTruthy()
  })

  it("el modal explica que pasa a revisión y que se avisa en la app; al enviar queda en revisión", async () => {
    render(<SuggestedNotice spotId={7} />)
    await flush()
    fireEvent.click(screen.getByRole("button", { name: CLAIM }))
    expect(screen.getByText(/Tu pedido pasa a revisión/)).toBeTruthy()
    expect(screen.getByText(/te avisamos acá en la app/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText("¿Cómo podemos verificarlo? (opcional)"), { target: { value: "Soy el encargado" } })
    fireEvent.click(screen.getByRole("button", { name: "Enviar pedido" }))
    await flush()
    expect(posts).toEqual([{ url: "/spots/7/claims", body: { message: "Soy el encargado" } }])
    expect(screen.getByText("⏳ Tu pedido para hacerte cargo está en revisión.")).toBeTruthy()
    expect(screen.queryByRole("button", { name: CLAIM })).toBeNull()
  })

  it("si ya lo había pedido, muestra que está en revisión", async () => {
    pending = true
    render(<SuggestedNotice spotId={7} />)
    await flush()
    expect(screen.getByText("⏳ Tu pedido para hacerte cargo está en revisión.")).toBeTruthy()
  })
})
