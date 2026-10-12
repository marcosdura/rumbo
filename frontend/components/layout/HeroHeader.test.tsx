import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

// El encabezado del hero de la home es la misma barra que el Navbar (que ahí
// se oculta hasta pasar el hero): estos tests cuidan que no se vuelvan a
// separar (antes era una copia, con otros márgenes, y la barra saltaba).
let session: { user: { name: string; email: string; image: null }; id_token?: string } | null = null
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: session, status: session ? "authenticated" : "unauthenticated" }),
  signOut: () => {},
}))
vi.mock("@/components/layout/AuthModal", () => ({ default: () => null }))
vi.mock("@/components/layout/NotificationBell", () => ({ default: () => <span>campanita</span> }))
vi.mock("next/image", () => ({ default: (props: { alt: string }) => <img alt={props.alt} /> }))
vi.mock("next/navigation", () => ({ usePathname: () => "/" }))
vi.mock("@/components/spots/SearchBar", () => ({ default: () => null }))

const { default: HeroHeader } = await import("./HeroHeader")
const { default: Navbar } = await import("./Navbar")

describe("HeroHeader", () => {
  it("ofrece Agregar lugar (botón y menú), también sin sesión", () => {
    session = null
    render(<HeroHeader />)
    fireEvent.click(screen.getByRole("button", { name: "Menú" }))
    const links = screen.getAllByRole("link", { name: /Agregar lugar/ })
    expect(links).toHaveLength(2)
    links.forEach(link => expect(link.getAttribute("href")).toBe("/agregar-lugar"))
    expect(screen.queryByText("campanita")).toBeNull()
  })

  it("con sesión muestra la campanita", () => {
    session = { user: { name: "Ana", email: "ana@test.com", image: null }, id_token: "t" }
    render(<HeroHeader />)
    expect(screen.getByText("campanita")).toBeTruthy()
  })

  it("el menú tiene lo mismo que el del Navbar (con y sin sesión)", () => {
    for (const s of [null, { user: { name: "Ana", email: "ana@test.com", image: null }, id_token: "t" }]) {
      session = s
      const menuOf = (ui: React.ReactElement) => {
        const { container, unmount } = render(ui)
        const items = Array.from(container.querySelectorAll(".dropdown-menu .menu-link, .dropdown-menu .signin-btn")).map(e => e.textContent?.trim())
        unmount()
        return items
      }
      expect(menuOf(<HeroHeader />)).toEqual(menuOf(<Navbar />))
    }
  })

  it("es la misma barra que el Navbar: mismos estilos de altura y márgenes", () => {
    session = null
    const barOf = (ui: React.ReactElement) => {
      const { container, unmount } = render(ui)
      const bar = container.querySelector(".nav-bar")
      const css = bar?.querySelector("style")?.textContent
      unmount()
      return css
    }
    const hero = barOf(<HeroHeader />)
    expect(hero).toMatch(/\.nav-bar \{[^}]*padding: 20px 24px;/)
    expect(hero).toMatch(/\.nav-bar\s+\{ padding: 14px 16px; \}/)
    expect(barOf(<Navbar />)).toBe(hero)
  })

  it("sin envoltorios que le sumen margen: la barra es lo de afuera", () => {
    session = null
    const { container } = render(<HeroHeader />)
    expect(container.firstElementChild?.className).toBe("nav-bar")
  })
})
