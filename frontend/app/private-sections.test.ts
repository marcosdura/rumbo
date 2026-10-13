import { describe, expect, it, vi } from "vitest"
import { PRIVATE_SECTIONS } from "@/lib/seo"

vi.mock("@/lib/api", () => ({ api: { get: () => Promise.resolve({ data: [] }) } }))

const TITLES: Record<string, string> = {
  "/admin": "Administración", "/dashboard": "Panel", "/profile": "Mi perfil", "/favorites": "Favoritos",
  "/reviews": "Mis reseñas", "/notificaciones": "Notificaciones", "/agregar-lugar": "Agregar un lugar",
}

describe("Páginas de la cuenta y del admin", () => {
  it.each(PRIVATE_SECTIONS)("%s: título propio y fuera de Google (antes el título de la home e indexable)", async section => {
    const { metadata } = await import(`./${section.slice(1)}/layout.tsx`)
    expect(metadata.title).toBe(`${TITLES[section]} | Rumbo`)
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })

  it("robots.txt las bloquea a todas (antes faltaban /dashboard, /reviews y /notificaciones)", async () => {
    const { default: robots } = await import("./robots")
    const rules = robots().rules as { disallow: string[] }
    expect(rules.disallow).toEqual(PRIVATE_SECTIONS)
    expect(rules.disallow).toEqual(expect.arrayContaining(["/dashboard", "/reviews", "/notificaciones"]))
  })
})
