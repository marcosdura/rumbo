import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import ConfirmModal from "./ConfirmModal"

const base = { open: true, title: "¿Seguro?", onConfirm: vi.fn(), onCancel: vi.fn() }

describe("ConfirmModal", () => {
  it("cerrado no muestra nada", () => {
    const { container } = render(<ConfirmModal {...base} open={false} />)
    expect(container.innerHTML).toBe("")
  })

  it("por defecto es el botón rojo de eliminar", () => {
    render(<ConfirmModal {...base} />)
    const confirm = screen.getByRole("button", { name: "Eliminar" })
    expect(confirm.className).toBe("confirm-modal-confirm-btn")
  })

  it("variante primary para confirmar algo que no destruye nada", () => {
    render(<ConfirmModal {...base} confirmVariant="primary" confirmLabel="Guardar cambios" />)
    expect(screen.getByRole("button", { name: "Guardar cambios" }).className).toContain("primary")
  })

  it("muestra el contenido extra", () => {
    render(<ConfirmModal {...base}><p>Pasan a revisión: nombre</p></ConfirmModal>)
    expect(screen.getByText("Pasan a revisión: nombre")).toBeTruthy()
  })

  it("cargando muestra el texto propio y deshabilita", () => {
    render(<ConfirmModal {...base} loading loadingLabel="Cancelando..." />)
    const button = screen.getByRole("button", { name: "Cancelando..." }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })

  it("confirmar y cancelar", () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ConfirmModal {...base} onConfirm={onConfirm} onCancel={onCancel} cancelLabel="Volver" />)
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }))
    fireEvent.click(screen.getByRole("button", { name: "Volver" }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("con frase, confirmar se habilita recién al escribirla", () => {
    render(<ConfirmModal {...base} confirmPhrase="CONFIRMAR" />)
    const confirm = screen.getByRole("button", { name: "Eliminar" }) as HTMLButtonElement
    expect(confirm.disabled).toBe(true)
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "CONFIRMAR" } })
    expect(confirm.disabled).toBe(false)
  })

  it("al volver a abrir, el campo arranca vacío", () => {
    const { rerender } = render(<ConfirmModal {...base} confirmPhrase="CONFIRMAR" />)
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "CONFIRMAR" } })
    rerender(<ConfirmModal {...base} confirmPhrase="CONFIRMAR" open={false} />)
    rerender(<ConfirmModal {...base} confirmPhrase="CONFIRMAR" />)
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("")
    expect((screen.getByRole("button", { name: "Eliminar" }) as HTMLButtonElement).disabled).toBe(true)
  })
})
