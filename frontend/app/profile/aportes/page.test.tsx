import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { id_token: "t" }, status: "authenticated" }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("../MyContributionsCard", () => ({ default: ({ token }: { token: string }) => <p>aportes con {token}</p> }))

const { default: MyContributionsPage } = await import("./page")

describe("Mis aportes", () => {
  it("muestra los aportes con el encabezado del perfil", () => {
    render(<MyContributionsPage />)
    expect(screen.getByRole("heading", { name: "Mis aportes" })).toBeTruthy()
    expect(screen.getByText("aportes con t")).toBeTruthy()
  })
})
