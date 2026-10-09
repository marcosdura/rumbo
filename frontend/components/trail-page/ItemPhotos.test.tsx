import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"

// Sesión, subida a Cloudinary y API simuladas con valores comunes, no vi.fn.
let session: { id_token: string } | null = { id_token: "t" }
let posted: { url: string; body: unknown; token?: string }[] = []
let uploadedFor: number[] = []
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: session }) }))
vi.mock("next-cloudinary", () => ({ CldImage: ({ alt }: { alt: string }) => <img alt={alt} /> }))
vi.mock("@/components/layout/AuthModal", () => ({ default: () => <div role="dialog">Ingresá</div> }))
vi.mock("@/components/spot-detail/ImageGallery", () => ({ default: () => null }))
vi.mock("@/lib/uploadImage", () => ({
  ALLOWED_IMAGE_TYPES: ["image/jpeg"],
  MAX_IMAGE_BYTES: 1000,
  uploadImageToCloudinary: (_f: File, p: { spotId: number }) => {
    uploadedFor.push(p.spotId)
    return Promise.resolve({ url: "u", publicId: `rumbo/spots/${p.spotId}/${uploadedFor.length.toString(16).padStart(16, "0")}` })
  },
}))
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  api: { post: (url: string, body: unknown, opts: { token?: string }) => { posted.push({ url, body, token: opts?.token }); return Promise.resolve({ data: {} }) } },
}))

const { default: ItemPhotos } = await import("./ItemPhotos")

const props = { photos: [], slots: 2, target: "trekking_route" as const, targetId: 4, spotId: 7, name: "Cumbre", emptyText: "Sin fotos todavía." }
const jpg = (name: string) => new File(["x"], name, { type: "image/jpeg" })

afterEach(() => { session = { id_token: "t" }; posted = []; uploadedFor = [] })

describe("Subir fotos de una ruta, sector o vía", () => {
  it("sin sesión pide ingresar", () => {
    session = null
    render(<ItemPhotos {...props} />)
    fireEvent.click(screen.getByRole("button", { name: "＋ Subir fotos" }))
    expect(screen.getByRole("dialog").textContent).toBe("Ingresá")
  })

  it("sube a la carpeta del lugar, las manda a revisión y avisa", async () => {
    render(<ItemPhotos {...props} />)
    fireEvent.click(screen.getByRole("button", { name: "＋ Subir fotos" }))
    fireEvent.change(screen.getByLabelText("Elegir fotos"), { target: { files: [jpg("a.jpg"), jpg("b.jpg")] } })
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Subir 2 fotos" })) })
    expect(uploadedFor).toEqual([7, 7])
    expect(posted).toEqual([{
      url: "/photos", token: "t",
      body: { target: "trekking_route", target_id: 4, public_ids: ["rumbo/spots/7/0000000000000001", "rumbo/spots/7/0000000000000002"] },
    }])
    expect(screen.getByRole("status").textContent).toContain("Tus fotos quedan en revisión")
    // Ya no queda lugar: el botón se va.
    expect(screen.queryByRole("button", { name: /Subir fotos|Sumar fotos/ })).toBeNull()
  })

  it("no deja elegir más de las que entran", () => {
    render(<ItemPhotos {...props} slots={1} />)
    fireEvent.click(screen.getByRole("button", { name: "＋ Subir fotos" }))
    fireEvent.change(screen.getByLabelText("Elegir fotos"), { target: { files: [jpg("a.jpg"), jpg("b.jpg")] } })
    expect(screen.getByText("Podés subir hasta 1 foto más.")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Subir foto" })).toBeTruthy()
  })

  it("solo fotos", () => {
    render(<ItemPhotos {...props} />)
    fireEvent.click(screen.getByRole("button", { name: "＋ Subir fotos" }))
    fireEvent.change(screen.getByLabelText("Elegir fotos"), { target: { files: [new File(["x"], "a.pdf", { type: "application/pdf" })] } })
    expect(screen.getByText("Solo fotos (JPG, PNG, WEBP o HEIC) de hasta 15 MB.")).toBeTruthy()
  })
})
