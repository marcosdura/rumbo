import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"

let mine: unknown[] = []
vi.mock("@/lib/api", () => ({ api: { get: () => Promise.resolve({ data: mine }) } }))

const { default: MyOperatorsCard } = await import("./MyOperatorsCard")

describe("MyOperatorsCard", () => {
  it("sin escuelas no aparece", async () => {
    mine = []
    const { container } = render(<MyOperatorsCard token="t" />)
    await waitFor(() => expect(container.innerHTML).toBe(""))
  })

  it("cada escuela con su estado y el acceso a administrarla", async () => {
    mine = [{
      id: 7, kind: "kayak", name: "Kayak Laguna", is_approved: false,
      spot: { id: 3, name: "Laguna Garzón", slug: null, is_approved: true },
      change_request: null,
    }]
    render(<MyOperatorsCard token="t" />)
    expect(await screen.findByText("Kayak Laguna")).toBeTruthy()
    expect(screen.getByText("Servicio de kayak en Laguna Garzón")).toBeTruthy()
    expect(screen.getByText("En revisión")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Administrar →" }).getAttribute("href")).toBe("/dashboard/operadores/kayak/7")
  })
})
