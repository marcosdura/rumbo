import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import MultiChoiceUnknown from "./MultiChoiceUnknown"

function Harness() {
  const [value, setValue] = useState<string[] | null>(null)
  return (
    <>
      <MultiChoiceUnknown label="Niveles" options={{ a: "Principiante", b: "Avanzado" }} value={value} onChange={setValue} />
      <output>{JSON.stringify(value)}</output>
    </>
  )
}

const pressed = (name: string) => screen.getByRole("button", { name }).getAttribute("aria-pressed")

describe("MultiChoiceUnknown", () => {
  it("arranca en No sé, elige varias y al sacar la última vuelve a No sé", () => {
    render(<Harness />)
    expect(pressed("No sé")).toBe("true")
    fireEvent.click(screen.getByRole("button", { name: "Principiante" }))
    fireEvent.click(screen.getByRole("button", { name: "Avanzado" }))
    expect(screen.getByRole("status").textContent).toBe(JSON.stringify(["a", "b"]))
    expect(pressed("No sé")).toBe("false")
    fireEvent.click(screen.getByRole("button", { name: "Principiante" }))
    fireEvent.click(screen.getByRole("button", { name: "Avanzado" }))
    expect(screen.getByRole("status").textContent).toBe("null")
  })

  it("No sé borra lo elegido", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: "Principiante" }))
    fireEvent.click(screen.getByRole("button", { name: "No sé" }))
    expect(screen.getByRole("status").textContent).toBe("null")
  })
})
