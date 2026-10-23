import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("next-cloudinary", () => ({ CldImage: () => null }))
vi.mock("@/components/ui/ReportButton", () => ({ default: () => null }))

const { default: ReviewCard } = await import("./ReviewCard")

describe("una reseña", () => {
  it("respeta los saltos de línea de quien la escribió", () => {
    const comment = "Muy lindo.\n\nOjo con el barro en invierno."
    render(<ReviewCard review={{ id: 1, rating: 5, comment, created_at: "2026-10-01T00:00:00Z", user: { name: "Ana" } }}
      onEdit={() => {}} onDelete={() => {}} onOpenPhoto={() => {}} />)
    const p = screen.getByText(/Muy lindo/)
    expect(p.textContent).toBe(comment)
    expect(p.style.whiteSpace).toBe("pre-line")
  })
})
