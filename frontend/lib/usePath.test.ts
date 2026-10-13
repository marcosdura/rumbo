import { describe, expect, it } from "vitest"
import { normalizePath } from "./usePath"

describe("normalizePath", () => {
  it("la home es '/' aunque Next la arme como '/index' al regenerarla", () => {
    expect(normalizePath("/index")).toBe("/")
    expect(normalizePath("/")).toBe("/")
    expect(normalizePath(null)).toBe("/")
  })

  it("el resto queda igual", () => {
    expect(normalizePath("/spots/cabo-polonio")).toBe("/spots/cabo-polonio")
    expect(normalizePath("/indexado")).toBe("/indexado")
  })
})
