import { afterEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import ShareModal from "./ShareModal"

afterEach(() => {
  cleanup()
  // jsdom no tiene navigator.share: se agrega y se saca en cada test.
  delete (navigator as { share?: unknown }).share
})

describe("compartir un lugar", () => {
  it("con el menú del teléfono, donde existe", async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { share })
    render(<ShareModal name="Cerro Arequita" onClose={() => {}} />)
    await act(() => { fireEvent.click(screen.getByRole("button", { name: /Más opciones/ })) })
    expect(share).toHaveBeenCalledWith({ title: "Cerro Arequita", text: "Mirá esto: Cerro Arequita", url: window.location.href })
  })

  it("cancelar el menú no deja un error suelto", async () => {
    // Cerrar el menú sin elegir rechaza la promesa: se atrapa.
    const rejected = Promise.reject(new DOMException("cancelado", "AbortError"))
    const caught = vi.spyOn(rejected, "catch")
    Object.assign(navigator, { share: vi.fn().mockReturnValue(rejected) })
    render(<ShareModal name="Cerro" onClose={() => {}} />)
    await act(() => { fireEvent.click(screen.getByRole("button", { name: /Más opciones/ })) })
    expect(caught).toHaveBeenCalled()
    expect(screen.getByRole("dialog")).toBeTruthy()
  })

  it("donde no existe, quedan copiar el link y WhatsApp", () => {
    render(<ShareModal name="Cerro" onClose={() => {}} />)
    expect(screen.queryByRole("button", { name: /Más opciones/ })).toBeNull()
    expect(screen.getByRole("button", { name: /Copiar link/ })).toBeTruthy()
    expect(screen.getByRole("button", { name: /WhatsApp/ })).toBeTruthy()
  })
})
