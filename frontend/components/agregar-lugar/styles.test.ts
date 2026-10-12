import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { s } from "./styles"

describe("Tipografía", () => {
  it("el formulario usa la letra del resto del sitio (antes Geist)", () => {
    expect(s.page.fontFamily).toBe("var(--font-dm-sans), sans-serif")
  })

  it("el sitio ya no carga Geist en cada página", () => {
    const layout = readFileSync("app/layout.tsx", "utf-8")
    expect(layout).not.toMatch(/import \{[^}]*Geist/)
    expect(layout).not.toMatch(/Geist(_Mono)?\(\{/)
    expect(readFileSync("app/globals.css", "utf-8")).not.toMatch(/geist/)
  })
})
