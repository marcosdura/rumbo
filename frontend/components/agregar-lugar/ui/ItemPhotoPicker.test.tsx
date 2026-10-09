import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import ItemPhotoPicker from "./ItemPhotoPicker"

URL.createObjectURL = () => "blob:x"
URL.revokeObjectURL = () => {}

const jpg = (name: string) => new File(["x"], name, { type: "image/jpeg" })

function Harness({ initial = [] as File[] }) {
  const [files, setFiles] = useState<File[]>(initial)
  return (
    <>
      <ItemPhotoPicker label="Fotos de la ruta 1" files={files} onChange={setFiles} />
      <output>{files.map(f => f.name).join(",")}</output>
    </>
  )
}

describe("Fotos opcionales de una ruta, sector o vía en agregar lugar", () => {
  it("se agregan y se sacan", () => {
    render(<Harness />)
    fireEvent.change(screen.getByLabelText("Fotos de la ruta 1"), { target: { files: [jpg("a.jpg"), jpg("b.jpg")] } })
    expect(screen.getByRole("status").textContent).toBe("a.jpg,b.jpg")
    fireEvent.click(screen.getByRole("button", { name: "Sacar foto 1" }))
    expect(screen.getByRole("status").textContent).toBe("b.jpg")
  })

  it("hasta 3: avisa y deja de ofrecer agregar", () => {
    render(<Harness initial={[jpg("a.jpg"), jpg("b.jpg")]} />)
    fireEvent.change(screen.getByLabelText("Fotos de la ruta 1"), { target: { files: [jpg("c.jpg"), jpg("d.jpg")] } })
    expect(screen.getByRole("status").textContent).toBe("a.jpg,b.jpg,c.jpg")
    expect(screen.getByText("Hasta 3 fotos.")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "＋ Agregar foto" })).toBeNull()
  })

  it("solo fotos", () => {
    render(<Harness />)
    fireEvent.change(screen.getByLabelText("Fotos de la ruta 1"), { target: { files: [new File(["x"], "a.pdf", { type: "application/pdf" })] } })
    expect(screen.getByRole("status").textContent).toBe("")
    expect(screen.getByText("Solo fotos (JPG, PNG, WEBP o HEIC) de hasta 15 MB.")).toBeTruthy()
  })
})
