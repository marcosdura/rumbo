import { describe, expect, it } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import FailuresNotice from "./FailuresNotice"
import type { Failure } from "./submit"

function Harness({ initial }: { initial: Failure[] }) {
  const [failures, setFailures] = useState(initial)
  return <FailuresNotice failures={failures} onChange={setFailures} />
}

describe("FailuresNotice", () => {
  it("nombra lo que falló y al reintentar bien avisa que se guardó todo", async () => {
    let tries = 0
    render(<Harness initial={[{ label: "Sector «Norte» y sus vías", retry: async () => { tries++ } }]} />)
    expect(screen.getByText("Sector «Norte» y sus vías")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Reintentar lo que faltó" }))
    await act(() => Promise.resolve())
    expect(tries).toBe(1)
    expect(screen.getByText("Listo, se guardó todo.")).toBeTruthy()
  })

  it("si sigue fallando, lo sigue mostrando", async () => {
    render(<Harness initial={[{ label: "Foto 2", retry: () => Promise.reject(new Error("x")) }]} />)
    fireEvent.click(screen.getByRole("button", { name: "Reintentar lo que faltó" }))
    await act(() => Promise.resolve())
    expect(screen.getByText("Todavía no se pudo guardar:")).toBeTruthy()
    expect(screen.getByText("Foto 2")).toBeTruthy()
  })

  it("sin fallas no muestra nada", () => {
    const { container } = render(<Harness initial={[]} />)
    expect(container.innerHTML).toBe("")
  })
})
