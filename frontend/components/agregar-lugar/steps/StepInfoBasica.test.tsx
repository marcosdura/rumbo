import { describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"

vi.mock("next/dynamic", () => ({ default: () => () => null }))
// "Cerro Ocupado" ya existe; cualquier otro nombre, no.
vi.mock("@/lib/api", () => ({ api: { get: (_: string, o: { params: { name: string } }) => Promise.resolve({ data: { exists: o.params.name === "Cerro Ocupado" } }) } }))

const { default: StepInfoBasica } = await import("./StepInfoBasica")
const { emptyBasic } = await import("../constants")

function Harness({ ask }: { ask: boolean }) {
  const [basic, setBasic] = useState(emptyBasic())
  const [isResponsible, setIsResponsible] = useState<boolean | null>(null)
  return (
    <StepInfoBasica
      basic={basic} setBasic={setBasic} upd={(f, v) => setBasic(p => ({ ...p, [f]: v }))}
      isPublic={null} setIsPublic={() => {}} publicTransport={null} setPublicTransport={() => {}}
      error={null} onBack={() => {}} onNext={() => {}}
      {...(ask ? { isResponsible, setIsResponsible } : {})}
    />
  )
}

const QUESTION = "¿Sos el responsable o dueño de este lugar?"

describe("StepInfoBasica: ¿responsable o visitante?", () => {
  it("pregunta, y cada respuesta explica qué pasa después", () => {
    render(<Harness ask />)
    expect(screen.getByText(QUESTION)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: /No, lo conozco como visitante/ }))
    expect(screen.getByText(/una vez publicado, lo administra el equipo de Rumbo/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: /Sí, soy el responsable/ }))
    expect(screen.getByText(/Vas a poder administrarlo desde tu perfil/)).toBeTruthy()
  })

  it("es obligatoria: sin responder queda marcada", () => {
    render(<Harness ask />)
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }))
    expect(screen.getByText(QUESTION).getAttribute("style")).toContain("rgb(229, 62, 62)")
  })

  it("en una playa nueva no se pregunta", () => {
    render(<Harness ask={false} />)
    expect(screen.queryByText(QUESTION)).toBeNull()
  })

  it("pregunta mascotas, reserva y señal, con No sé", () => {
    render(<Harness ask={false} />)
    for (const q of ["¿Acepta mascotas?", "¿Hace falta reservar?", "¿Hay señal de celular?"]) {
      expect(screen.getByText(q, { exact: false })).toBeTruthy()
    }
    expect(screen.getAllByRole("button", { name: "No sé" }).length).toBeGreaterThanOrEqual(3)
  })
})

describe("StepInfoBasica: nombre repetido", () => {
  it("avisa si ya existe, y al cambiar o borrar el nombre el aviso se va enseguida", async () => {
    vi.useFakeTimers()
    render(<Harness ask={false} />)
    // El primer campo de texto es el nombre.
    const input = screen.getAllByRole("textbox")[0] as HTMLInputElement
    fireEvent.change(input, { target: { value: "Cerro Ocupado" } })
    await act(async () => { await vi.advanceTimersByTimeAsync(500) })
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }))
    expect(screen.getByText("Ya existe un lugar con este nombre")).toBeTruthy()
    fireEvent.change(input, { target: { value: "Cerro Libre" } })
    expect(screen.queryByText("Ya existe un lugar con este nombre")).toBeNull()
    fireEvent.change(input, { target: { value: "Cerro Ocupado" } })
    expect(screen.getByText("Ya existe un lugar con este nombre")).toBeTruthy()
    fireEvent.change(input, { target: { value: "" } })
    expect(screen.queryByText("Ya existe un lugar con este nombre")).toBeNull()
    vi.useRealTimers()
  })
})
