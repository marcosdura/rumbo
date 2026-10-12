import { describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import { render, screen } from "@testing-library/react"

vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/layout/Footer", () => ({ default: () => null }))

const { default: LegalPage, metadata } = await import("./page")
const { SECTIONS } = await import("./content")

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf-8")
const text = () => document.body.textContent ?? ""

describe("Legal: la página", () => {
  it("todas las secciones abiertas, con un índice que lleva a cada una", () => {
    render(<LegalPage />)
    for (const s of SECTIONS) {
      expect(document.getElementById(s.id)?.tagName).toBe("SECTION")
      expect(screen.getByRole("link", { name: new RegExp(s.title.replace(/[?¿]/g, ".")) }).getAttribute("href")).toBe(`#${s.id}`)
    }
    expect(text()).not.toContain("próximamente")
    expect(metadata.title).toBe("Legal e información | Rumbo")
  })

  it("los links del footer y del login llevan a secciones que existen", () => {
    const ids = new Set(SECTIONS.map(s => s.id))
    const sources = [read("../../components/layout/Footer.jsx"), read("../../components/layout/AuthModal.jsx"), read("../../components/agregar-lugar/AgregarLugar.tsx")]
    const anchors = sources.flatMap(src => [...src.matchAll(/\/legal#([a-z]+)/g)].map(m => m[1]))
    expect(anchors.length).toBeGreaterThan(4)
    for (const a of anchors) expect(ids).toContain(a)
  })
})

describe("Legal: el texto dice lo que el sistema hace", () => {
  it("menciona Google Analytics, que el sitio usa (antes decía que no)", () => {
    expect(read("../layout.tsx")).toContain("GoogleAnalytics")
    render(<LegalPage />)
    expect(text()).toContain("Google Analytics")
    expect(text()).not.toMatch(/sin Google Analytics/i)
  })

  it("no promete cosas que no existen: borrado por inactividad, emails, ubicación", () => {
    render(<LegalPage />)
    expect(text()).not.toMatch(/3 meses/)
    expect(text()).not.toMatch(/novedades/i)
    expect(text()).toContain("No usamos la ubicación de tu dispositivo.")
  })

  it("la sesión dura lo que dice (7 días)", () => {
    expect(read("../api/auth/[...nextauth]/route.js")).toMatch(/maxAge:\s*60 \* 60 \* 24 \* 7\b/)
    render(<LegalPage />)
    expect(text()).toContain("hasta 7 días")
  })

  it("nombra a los servicios con los que se comparten datos", () => {
    render(<LegalPage />)
    for (const name of ["Cloudinary", "Vercel", "Railway"]) expect(text()).toContain(name)
  })
})
