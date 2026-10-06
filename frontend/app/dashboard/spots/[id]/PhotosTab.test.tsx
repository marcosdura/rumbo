import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import type { ComponentProps } from "react"
import PhotosTab from "./PhotosTab"

type Props = ComponentProps<typeof PhotosTab>

function renderTab(overrides: Partial<Props> = {}) {
  const props: Props = {
    sortedImages: [
      { cloudinary_public_id: "pub/1", is_main: true, order: 0 },
      { cloudinary_public_id: "pub/2", is_main: false, order: 1 },
    ],
    stagedPhotos: [],
    pendingPhotoIds: [],
    photoCount: 2,
    atPhotoLimit: false,
    lockAdd: false,
    sensitiveReviewed: true,
    photoError: null,
    photoLoading: false,
    setPhotoError: vi.fn(),
    onAddFiles: vi.fn(),
    onRemoveStaged: vi.fn(),
    onSetMain: vi.fn(),
    onDeletePhoto: vi.fn(),
    ...overrides,
  }
  render(<PhotosTab {...props} />)
  return props
}

describe("PhotosTab", () => {
  it("elegir archivos los pasa al padre", () => {
    const props = renderTab()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" })
    fireEvent.change(input, { target: { files: [file] } })
    expect(props.onAddFiles).toHaveBeenCalledWith([file])
  })

  it("con un pedido pendiente no se pueden agregar fotos", () => {
    renderTab({ lockAdd: true })
    const button = screen.getByRole("button", { name: "Cambio en revisión" })
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })

  it("en el límite no se pueden agregar fotos", () => {
    renderTab({ atPhotoLimit: true, photoCount: 10 })
    expect((screen.getByRole("button", { name: "Límite alcanzado" }) as HTMLButtonElement).disabled).toBe(true)
  })

  it("las fotos elegidas se ven como 'Sin guardar' y se pueden quitar", () => {
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" })
    const props = renderTab({ stagedPhotos: [{ file, url: "blob:1" }, { file, url: "blob:2" }] })
    expect(screen.getAllByText("Sin guardar")).toHaveLength(2)
    expect(screen.getByText(/pasan por revisión/)).toBeTruthy()
    fireEvent.click(screen.getAllByRole("button", { name: "Quitar foto" })[1])
    expect(props.onRemoveStaged).toHaveBeenCalledWith(1)
  })

  it("las fotos del pedido pendiente se ven 'En revisión' y sin acciones", () => {
    renderTab({ pendingPhotoIds: ["rumbo/spots/1/abc"] })
    expect(screen.getByText("En revisión")).toBeTruthy()
    // Solo las 2 publicadas tienen botón de eliminar.
    expect(screen.getAllByRole("button", { name: "Eliminar foto" })).toHaveLength(2)
  })

  it("elegir principal y eliminar avisan al padre", () => {
    const props = renderTab()
    fireEvent.click(screen.getByRole("button", { name: "Principal" }))
    expect(props.onSetMain).toHaveBeenCalledWith("pub/2")
    fireEvent.click(screen.getAllByRole("button", { name: "Eliminar foto" })[0])
    expect(props.onDeletePhoto).toHaveBeenCalledWith("pub/1")
  })

  it("muestra el error", () => {
    renderTab({ photoError: "El límite es 10 fotos por lugar." })
    expect(screen.getByText("El límite es 10 fotos por lugar.")).toBeTruthy()
  })
})
