import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"

const posts: { url: string; body: unknown }[] = []
let sectors = [{ id: 31, name: "Norte", routes: [{ name: "La Diagonal" }] }]
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error { constructor(public status: number, m: string) { super(m) } },
  api: {
    get: async () => ({ data: { sectors } }),
    post: async (url: string, body: unknown) => { posts.push({ url, body }); return { data: { created: 1, updated: 1 } } },
  },
}))
let xlsxRows: unknown[][] = []
vi.mock("read-excel-file/browser", () => ({ readSheet: async () => xlsxRows }))

const { default: ImportRoutesTab } = await import("./ImportRoutesTab")

const spot = (id: number, name: string, category = "Escalada") =>
  ({ id, name, department: "Lavalleja", category: { name: category }, owner_deleted_at: null }) as never

afterEach(() => { posts.length = 0; sectors = [{ id: 31, name: "Norte", routes: [{ name: "La Diagonal" }] }] })

async function ready() {
  render(<ImportRoutesTab spots={[spot(1, "Arequita"), spot(2, "Camping X", "Camping")]} token="t" loading={false} />)
  fireEvent.change(screen.getByLabelText("Lugar"), { target: { value: "1" } })
  await act(() => Promise.resolve())
  fireEvent.change(screen.getByLabelText("Sector"), { target: { value: "31" } })
}

async function upload(file: File) {
  await act(async () => { fireEvent.change(screen.getByLabelText("Subir planilla"), { target: { files: [file] } }) })
  await act(() => Promise.resolve())
}

describe("Importar vías (admin)", () => {
  it("solo ofrece lugares de escalada; sin sector elegido no se puede subir", () => {
    render(<ImportRoutesTab spots={[spot(1, "Arequita"), spot(2, "Camping X", "Camping")]} token="t" loading={false} />)
    const options = Array.from((screen.getByLabelText("Lugar") as HTMLSelectElement).options).map(o => o.textContent)
    expect(options).toEqual(["— Elegí un lugar de escalada —", "Arequita (Lavalleja)"])
    expect((screen.getByLabelText("Subir planilla") as HTMLInputElement).disabled).toBe(true)
  })

  it("con un CSV: muestra qué es nueva y qué se actualiza, e importa al sector", async () => {
    await ready()
    await upload(new File(["Nombre;Grado\nla diagonal;6b\nEl Techo;7b+\n"], "vias.csv", { type: "text/csv" }))
    expect(screen.getByText("2 vías: 1 nuevas, 1 se actualizan")).toBeTruthy()
    expect(screen.getByText("Actualiza")).toBeTruthy()
    expect(screen.getByText("Nueva")).toBeTruthy()
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Importar 2 vías" })) })
    expect(posts).toEqual([{ url: "/sectors/31/routes/import", body: { routes: [{ name: "la diagonal", grade: "6b" }, { name: "El Techo", grade: "7b+" }] } }])
    expect(screen.getByRole("status").textContent).toContain("1 vía nueva y 1 actualizada en Norte")
  })

  it("con un Excel lee la primera hoja", async () => {
    await ready()
    xlsxRows = [["Nombre", "Chapas"], ["Arista", 6]]
    await upload(new File(["x"], "vias.xlsx"))
    expect(screen.getByText("1 vías: 1 nuevas, 0 se actualizan")).toBeTruthy()
  })

  it("con errores no deja importar y dice qué está mal", async () => {
    await ready()
    await upload(new File(["Nombre;Grado\nUno;11z\n"], "vias.csv"))
    expect(screen.getByText(/Grado "11z"/)).toBeTruthy()
    const btn = screen.getByRole("button", { name: "Corregí los errores para importar" }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
    expect(posts).toEqual([])
  })

  it("una planilla sin la columna Nombre se rechaza con el motivo", async () => {
    await ready()
    await upload(new File(["Grado\n6a\n"], "vias.csv"))
    expect(screen.getByRole("alert").textContent).toMatch(/Falta la columna "Nombre"/)
  })
})
