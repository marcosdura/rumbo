import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

// package.json fija la versión de Node para Vercel (antes usaba la que tuviera
// configurada el proyecto). Los tests, el build y el e2e corren con esa misma.
describe("versión de Node", () => {
  it("la fijada en package.json es la que corre acá", () => {
    const { engines } = JSON.parse(readFileSync("package.json", "utf-8"))
    expect(engines.node).toBe(`${process.versions.node.split(".")[0]}.x`)
  })
})
