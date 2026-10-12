import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api"
import { isNotFound, nullIfNotFound } from "./notFound"

describe("no existe vs falló la API", () => {
  it("404 y 422 (id mal formado) son 'no existe'", () => {
    expect(isNotFound(new ApiError(404, "No encontrado"))).toBe(true)
    expect(isNotFound(new ApiError(422, "id inválido"))).toBe(true)
  })

  it("un 500, un 503 o un error de red no son 'no existe'", () => {
    expect(isNotFound(new ApiError(500, "Error 500"))).toBe(false)
    expect(isNotFound(new ApiError(503, "Error 503"))).toBe(false)
    expect(isNotFound(new TypeError("fetch failed"))).toBe(false)
  })

  it("nullIfNotFound: null si no existe, el error sigue de largo si falló", async () => {
    await expect(nullIfNotFound(Promise.resolve(7))).resolves.toBe(7)
    await expect(nullIfNotFound(Promise.reject(new ApiError(404, "")))).resolves.toBeNull()
    await expect(nullIfNotFound(Promise.reject(new ApiError(502, "caído")))).rejects.toThrow("caído")
  })
})
