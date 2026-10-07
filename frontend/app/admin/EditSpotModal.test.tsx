import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useState } from "react"
import { ApiError } from "@/lib/api"
import EditSpotModal from "./EditSpotModal"

type Spot = { id: number; name: string; description: string }

// onSave como función común, no vi.fn (ver components/agregar-lugar/submit.test.ts).
function Harness({ onSave, initial = { id: 1, name: "Cascada", description: "Linda" } }: {
  onSave: (spot: Spot) => Promise<void>
  initial?: Spot
}) {
  const [editing, setEditing] = useState<Spot | null>(initial)
  return (
    <>
      <button onClick={() => setEditing(initial)}>abrir</button>
      <EditSpotModal
        editingSpot={editing}
        setEditingSpot={setEditing}
        onCancel={() => setEditing(null)}
        onSave={async () => { await onSave(editing!); setEditing(null) }}
      />
    </>
  )
}

describe("EditSpotModal", () => {
  it("si guarda bien, se cierra", async () => {
    const saved: Spot[] = []
    render(<Harness onSave={async (s) => { saved.push(s) }} />)
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(saved).toEqual([{ id: 1, name: "Cascada", description: "Linda" }])
  })

  it("si falla, queda abierto y muestra el motivo del backend", async () => {
    render(<Harness onSave={() => Promise.reject(new ApiError(409, "Ya existe un lugar con ese nombre"))} />)
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    expect((await screen.findByRole("alert")).textContent).toBe("Ya existe un lugar con ese nombre")
    expect(screen.getByRole("dialog")).toBeTruthy()
    expect((screen.getByRole("button", { name: "Guardar" }) as HTMLButtonElement).disabled).toBe(false)
  })

  it("un error de validación o de red muestra un mensaje genérico", async () => {
    render(<Harness onSave={() => Promise.reject(new ApiError(422, "[object Object]"))} />)
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    expect((await screen.findByRole("alert")).textContent).toBe("No se pudo guardar. Intentá de nuevo.")
  })

  it("mientras guarda, los botones quedan deshabilitados", async () => {
    let finish = () => {}
    render(<Harness onSave={() => new Promise<void>(r => { finish = r })} />)
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    const saving = await screen.findByRole("button", { name: "Guardando..." }) as HTMLButtonElement
    expect(saving.disabled).toBe(true)
    expect((screen.getByRole("button", { name: "Cancelar" }) as HTMLButtonElement).disabled).toBe(true)
    finish()
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("con el nombre vacío no deja guardar", () => {
    render(<Harness onSave={async () => {}} />)
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "  " } })
    expect(screen.getByText("El nombre no puede quedar vacío.")).toBeTruthy()
    expect((screen.getByRole("button", { name: "Guardar" }) as HTMLButtonElement).disabled).toBe(true)
  })

  it("al reabrir no arrastra el error anterior", async () => {
    render(<Harness onSave={() => Promise.reject(new ApiError(500, "Falló"))} />)
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await screen.findByRole("alert")
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }))
    fireEvent.click(screen.getByRole("button", { name: "abrir" }))
    expect(screen.getByRole("dialog")).toBeTruthy()
    expect(screen.queryByRole("alert")).toBeNull()
  })
})
