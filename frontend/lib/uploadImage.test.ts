import { afterEach, describe, expect, it, vi } from "vitest"
import { buildPublicId, uploadImageToCloudinary } from "./uploadImage"

// Mismo formato que exige el backend en can-upload (routers/spots.py).
const BACKEND_FORMAT = /^42\/[0-9a-f]{16}$/

describe("buildPublicId", () => {
  it("usa el id del spot + 16 hex, como exige el backend", () => {
    expect(buildPublicId(42)).toMatch(BACKEND_FORMAT)
  })

  it("no se repite", () => {
    const ids = new Set(Array.from({ length: 200 }, () => buildPublicId(42)))
    expect(ids.size).toBe(200)
  })
})

describe("uploadImageToCloudinary", () => {
  const signature = {
    signature: "sig", timestamp: 1, folder: "rumbo/spots", apiKey: "key",
    cloudName: "cloud", allowedFormats: "jpg,png", overwrite: "false",
  }

  function mockFetch(uploadResponse: object) {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(signature)))
      .mockResolvedValueOnce(new Response(JSON.stringify(uploadResponse)))
    vi.stubGlobal("fetch", fetchMock)
    return fetchMock
  }

  afterEach(() => vi.unstubAllGlobals())

  const file = new File([new Uint8Array(10)], "a.jpg", { type: "image/jpeg" })

  it("manda overwrite=false tal como vino firmado", async () => {
    const fetchMock = mockFetch({ secure_url: "https://x", public_id: "rumbo/spots/42/abc" })
    await uploadImageToCloudinary(file, { spotId: 42 })
    const form = fetchMock.mock.calls[1][1].body as FormData
    expect(form.get("overwrite")).toBe("false")
    expect(form.get("public_id")).toMatch(BACKEND_FORMAT)
  })

  it("devuelve el public_id que asignó Cloudinary", async () => {
    mockFetch({ secure_url: "https://x", public_id: "rumbo/spots/42/abc" })
    await expect(uploadImageToCloudinary(file, { spotId: 42 })).resolves.toEqual({
      url: "https://x", publicId: "rumbo/spots/42/abc",
    })
  })

  it("si el id ya existía, falla en vez de devolver la foto vieja", async () => {
    // Con overwrite=false, Cloudinary responde 200 con el archivo VIEJO.
    mockFetch({ secure_url: "https://vieja", public_id: "rumbo/spots/42/abc", existing: true })
    await expect(uploadImageToCloudinary(file, { spotId: 42 })).rejects.toThrow()
  })
})
