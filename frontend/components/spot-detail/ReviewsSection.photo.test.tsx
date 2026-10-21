import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"

// La foto de una reseña: se elige en el formulario, se sube después de
// guardar la reseña y pasa por revisión (backend/item_photos.py).
type Review = Record<string, unknown>
let reviews: Review[] = []
let myReview: Review | null = null
let uploadFails = false
const calls: string[] = []

vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { id_token: "tok" } }) }))
vi.mock("@/components/layout/AuthModal", () => ({ default: () => null }))
vi.mock("@/components/ui/ReportButton", () => ({ default: () => null }))
vi.mock("@/lib/analytics", () => ({ trackEvent: () => {} }))
vi.mock("next-cloudinary", () => ({ CldImage: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} /> }))
vi.mock("@/components/spot-detail/ImageGallery", () => ({ default: ({ name }: { name: string }) => <div role="dialog">{name}</div> }))
vi.mock("@/lib/uploadImage", async () => {
  const real = await vi.importActual<typeof import("@/lib/uploadImage")>("@/lib/uploadImage")
  return {
    ...real,
    uploadImageToCloudinary: async () => {
      calls.push("cloudinary")
      if (uploadFails) throw new Error("Llegaste al máximo de fotos por hoy.")
      return { url: "x", publicId: "rumbo/spots/12/0123456789abcdef" }
    },
  }
})
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  api: {
    get: (url: string) => Promise.resolve(url.endsWith("/summary")
      ? { data: { average: 5, total: reviews.length, my_review: myReview } }
      : { data: reviews, totalCount: reviews.length }),
    post: (url: string, body: unknown) => {
      calls.push(`POST ${url} ${JSON.stringify(body)}`)
      return Promise.resolve({ data: { id: 7 } })
    },
    patch: (url: string) => { calls.push(`PATCH ${url}`); return Promise.resolve({ data: {} }) },
    del: (url: string) => { calls.push(`DELETE ${url}`); return Promise.resolve({ data: {} }) },
  },
}))

const { default: ReviewsSection } = await import("./ReviewsSection")

afterEach(() => { reviews = []; myReview = null; uploadFails = false; calls.length = 0 })

const flush = () => act(() => new Promise(r => setTimeout(r, 0)))
const photo = new File([new Uint8Array(10)], "cerro.jpg", { type: "image/jpeg" })

async function writeWithPhoto() {
  render(<ReviewsSection spotId={12} />)
  await flush()
  fireEvent.click(screen.getByRole("button", { name: "✏️ Escribir una reseña" }))
  fireEvent.click(screen.getByLabelText("5 estrellas"))
  fireEvent.change(screen.getByLabelText("Una foto (opcional)"), { target: { files: [photo] } })
  fireEvent.click(screen.getByRole("button", { name: "Publicar reseña" }))
  await flush()
  await flush()
}

describe("la foto de una reseña", () => {
  it("se sube después de publicar la reseña, a esa reseña, y queda en revisión", async () => {
    await writeWithPhoto()
    expect(calls).toEqual([
      'POST /reviews/12 {"rating":5,"comment":""}',
      "cloudinary",
      'POST /photos {"target":"review","target_id":7,"public_ids":["rumbo/spots/12/0123456789abcdef"]}',
    ])
    expect(screen.getByRole("status").textContent).toContain("Tu foto queda en revisión")
  })

  it("si la foto no se puede subir, la reseña igual queda y se dice por qué", async () => {
    uploadFails = true
    await writeWithPhoto()
    expect(calls[0]).toBe('POST /reviews/12 {"rating":5,"comment":""}')
    expect(screen.getByRole("status").textContent).toBe("Tu reseña quedó guardada, pero la foto no se pudo subir: Llegaste al máximo de fotos por hoy.")
  })

  it("se ve en la reseña y se abre en grande; la propia en revisión, con aviso", async () => {
    reviews = [
      { id: 1, rating: 5, comment: "Lindo", created_at: "2026-10-01", user: { name: "Ana" }, is_mine: false, photo: { id: 3, cloudinary_public_id: "a", pending: false } },
      { id: 2, rating: 4, comment: "Bien", created_at: "2026-10-02", user: { name: "Yo" }, is_mine: true, photo: { id: 4, cloudinary_public_id: "b", pending: true } },
    ]
    render(<ReviewsSection spotId={12} />)
    await flush()
    expect(screen.getByRole("img", { name: "Foto de la reseña de Ana" })).toBeTruthy()
    expect(screen.getAllByText("⏳ En revisión: solo vos la ves.")).toHaveLength(1)
    fireEvent.click(screen.getByRole("button", { name: "Ver la foto de la reseña de Ana" }))
    expect(screen.getByRole("dialog").textContent).toBe("Foto de la reseña")
  })

  it("al editar una reseña con foto, se puede sacar (y no se ofrece otra)", async () => {
    myReview = { id: 2, rating: 4, comment: "Bien", photo: { id: 4, cloudinary_public_id: "b", pending: true } }
    render(<ReviewsSection spotId={12} />)
    await flush()
    fireEvent.click(screen.getByRole("button", { name: "✏️ Editar mi reseña" }))
    expect(screen.getByText("Tu foto está en revisión.")).toBeTruthy()
    expect(screen.queryByLabelText("Una foto (opcional)")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Sacar la foto" }))
    await flush()
    expect(calls).toEqual(["DELETE /photos/4"])
    expect(screen.getByRole("status").textContent).toBe("Sacaste la foto de tu reseña.")
  })
})
