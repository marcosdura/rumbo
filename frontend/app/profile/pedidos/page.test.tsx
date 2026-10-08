import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { id_token: "t" }, status: "authenticated" }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("../MyRequestsCard", () => ({ default: ({ token }: { token: string }) => <p>pedidos con {token}</p> }))

const { default: MyRequestsPage } = await import("./page")

describe("Mis pedidos (página)", () => {
  it("muestra los pedidos con el encabezado del perfil", () => {
    render(<MyRequestsPage />)
    expect(screen.getByRole("heading", { name: "Mis pedidos" })).toBeTruthy()
    expect(screen.getByText("pedidos con t")).toBeTruthy()
  })
})
