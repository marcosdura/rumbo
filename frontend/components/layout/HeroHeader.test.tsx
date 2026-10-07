import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// El encabezado del hero de la home repite lo del Navbar (que ahí se oculta
// hasta pasar el hero): estos tests cuidan que no se vuelvan a separar.
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
})
