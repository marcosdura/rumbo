import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import Field from "./Field"
import TriStateToggle from "./TriStateToggle"

describe("Field: la etiqueta apunta a su campo", () => {
  it("con un campo adentro, el lector de pantalla lo nombra con la etiqueta", () => {
    render(<Field label="Nombre del lugar" required><input /></Field>)
    expect(screen.getByLabelText(/Nombre del lugar/).tagName).toBe("INPUT")
  })

  it("también si el campo está dentro de un <div> (el teléfono con su país): se conecta el primero", () => {
    render(
      <Field label="Teléfono" required={false}>
        <div><select><option>UY</option></select><input aria-label="Número" /></div>
      </Field>,
    )
    expect(screen.getByLabelText(/Teléfono/).tagName).toBe("SELECT")
    expect(screen.getByLabelText("Número").tagName).toBe("INPUT")
  })

  it("con error: el campo queda inválido y el mensaje se lee con él", () => {
    render(<Field label="Email" required hasError errorText="Ingresá un email válido"><input /></Field>)
    const input = screen.getByLabelText(/Email/)
    expect(input.getAttribute("aria-invalid")).toBe("true")
    expect(document.getElementById(input.getAttribute("aria-describedby")!)!.textContent).toBe("Ingresá un email válido")
  })

  it("sin error, nada de eso", () => {
    render(<Field label="Email" required={false}><input /></Field>)
    const input = screen.getByLabelText(/Email/)
    expect(input.hasAttribute("aria-invalid")).toBe(false)
    expect(input.hasAttribute("aria-describedby")).toBe(false)
  })

  it("con botones en vez de un campo, los agrupa con el nombre de la etiqueta", () => {
    render(<Field label="¿Acepta mascotas?" required={false}><TriStateToggle value={true} onChange={() => {}} /></Field>)
    expect(screen.getByRole("group", { name: /Acepta mascotas/ })).toBeTruthy()
  })

  it("respeta el id que ya tenga el campo", () => {
    render(<Field label="Nombre" required><input id="propio" /></Field>)
    expect(screen.getByLabelText(/Nombre/).id).toBe("propio")
  })
})

describe("botones de opción: dicen cuál está elegido", () => {
  it("Sí / No / No sé", () => {
    render(<TriStateToggle value={false} onChange={() => {}} />)
    expect(screen.getByRole("button", { name: "No" }).getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByRole("button", { name: "Sí" }).getAttribute("aria-pressed")).toBe("false")
    expect(screen.getByRole("button", { name: "No sé" }).getAttribute("aria-pressed")).toBe("false")
  })
})
