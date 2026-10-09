import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import SpotDescription from "./SpotDescription"

describe("SpotDescription", () => {
  it("respeta los párrafos que escribió el dueño", () => {
    render(<SpotDescription description={"Primer párrafo.\n\nSegundo párrafo."} />)
    const p = screen.getByText(/Primer párrafo/)
    expect(p.textContent).toBe("Primer párrafo.\n\nSegundo párrafo.")
    expect(p.style.whiteSpace).toBe("pre-line")
  })
})
