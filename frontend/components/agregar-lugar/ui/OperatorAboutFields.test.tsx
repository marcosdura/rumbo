import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import OperatorAboutFields from "./OperatorAboutFields"
import type { OperatorAbout } from "../types"
import { defaultKayak, defaultSurf } from "../constants"

// submit.ts importa la API: alcanza con un valor común.
vi.mock("@/lib/api", () => ({ api: {} }))
const { aboutPayload, kayakPayload, surfPayload } = await import("../submit")

function Harness({ onValue }: { onValue: (v: OperatorAbout) => void }) {
  const [value, setValue] = useState<OperatorAbout>({ description: "", price_from: "", price_note: "" })
  onValue(value)
  return <OperatorAboutFields what="la escuela" value={value} onChange={(f, v) => setValue(p => ({ ...p, [f]: v }))} />
}

describe("Descripción y precio en agregar lugar", () => {
  it("se completan los tres campos", () => {
    let last: OperatorAbout | null = null
    render(<Harness onValue={v => { last = v }} />)
    fireEvent.change(screen.getByPlaceholderText(/Qué ofrecen/), { target: { value: "Clases para chicos" } })
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "1200" } })
    fireEvent.change(screen.getByPlaceholderText("por clase"), { target: { value: "por clase" } })
    expect(last).toEqual({ description: "Clases para chicos", price_from: "1200", price_note: "por clase" })
  })

  it("se mandan al crear la escuela o el servicio; vacíos van como null", () => {
    expect(aboutPayload({ description: " Clases ", price_from: "0", price_note: "" }))
      .toEqual({ description: "Clases", price_from: 0, price_note: null })
    expect(surfPayload({ ...defaultSurf(), name: "Ola", price_from: "1200", price_note: "por clase" }))
      .toMatchObject({ description: null, price_from: 1200, price_note: "por clase" })
    expect(kayakPayload({ ...defaultKayak(), name: "Sur", description: "Salidas" }))
      .toMatchObject({ description: "Salidas", price_from: null, price_note: null })
  })
})

describe("Rutas de trekking: descripción", () => {
  it("se manda al crear la ruta; vacía va como null", async () => {
    const { routePayload } = await import("../submit")
    const { defaultRoute } = await import("../constants")
    expect(routePayload({ ...defaultRoute(), name: "Cumbre", description: " Por el bosque. " }).description).toBe("Por el bosque.")
    expect(routePayload({ ...defaultRoute(), name: "Cumbre" }).description).toBeNull()
  })
})
