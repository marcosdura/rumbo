import { describe, expect, it } from "vitest"
import { fireEvent, render } from "@testing-library/react"
import { useModalA11y } from "./useModalA11y"

function Modal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useModalA11y(open, onClose)
  return open ? <div ref={ref} role="dialog"><button>OK</button></div> : null
}

describe("useModalA11y", () => {
  it("Escape cierra", () => {
    const calls: string[] = []
    render(<Modal open onClose={() => calls.push("cerrar")} />)
    fireEvent.keyDown(document, { key: "Escape" })
    expect(calls).toEqual(["cerrar"])
  })

  it("Escape llama al onClose más reciente (los modales lo pasan inline)", () => {
    const calls: string[] = []
    const { rerender } = render(<Modal open onClose={() => calls.push("viejo")} />)
    rerender(<Modal open onClose={() => calls.push("nuevo")} />)
    fireEvent.keyDown(document, { key: "Escape" })
    expect(calls).toEqual(["nuevo"])
  })

  it("abierto frena el scroll de atrás y al cerrar lo devuelve", () => {
    const { rerender } = render(<Modal open onClose={() => {}} />)
    expect(document.body.style.overflow).toBe("hidden")
    rerender(<Modal open={false} onClose={() => {}} />)
    expect(document.body.style.overflow).toBe("")
  })
})
