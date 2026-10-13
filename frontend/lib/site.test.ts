import { describe, expect, it } from "vitest"
import { preconnectOrigins } from "./site"

describe("conexión anticipada", () => {
  it("a Cloudinary (fotos) y a la API (con CORS)", () => {
    expect(preconnectOrigins("https://api.rumbo.up.railway.app/v1")).toEqual([
      { href: "https://res.cloudinary.com" },
      { href: "https://api.rumbo.up.railway.app", crossOrigin: "anonymous" },
    ])
  })

  it("sin una dirección válida de la API, solo Cloudinary", () => {
    expect(preconnectOrigins(undefined)).toEqual([{ href: "https://res.cloudinary.com" }])
    expect(preconnectOrigins("no es una url")).toEqual([{ href: "https://res.cloudinary.com" }])
  })
})
