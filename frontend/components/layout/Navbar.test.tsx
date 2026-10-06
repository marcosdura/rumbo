import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

let session: { user: { name: string; email: string; image: null } } | null = null
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: session, status: session ? "authenticated" : "unauthenticated" }),
  signOut: () => {},
}))
vi.mock("next/navigation", () => ({ usePathname: () => "/spots" }))
vi.mock("@/components/spots/SearchBar", () => ({ default: () => null }))
vi.mock("@/components/layout/AuthModal", () => ({ default: () => null }))
// next/image necesita el loader de Next; para el test alcanza un <img>.
vi.mock("next/image", () => ({ default: (props: { alt: string }) => <img alt={props.alt} /> }))

const { default: Navbar } = await import("./Navbar")

describe("Navbar", () => {
  it("ofrece Agregar lugar sin sesión (en el botón y en el menú)", () => {
    session = null
    render(<Navbar />)
    const links = screen.getAllByRole("link", { name: /Agregar lugar/ })
    expect(links).toHaveLength(2)
    links.forEach(link => expect(link.getAttribute("href")).toBe("/agregar-lugar"))
  })

  it("y también con sesión", () => {
    session = { user: { name: "Ana", email: "ana@test.com", image: null } }
    render(<Navbar />)
    expect(screen.getAllByRole("link", { name: /Agregar lugar/ })).toHaveLength(2)
  })
})
