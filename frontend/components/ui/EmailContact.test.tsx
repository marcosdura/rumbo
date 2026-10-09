import { describe, expect, it } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import EmailContact from "./EmailContact"

describe("EmailContact", () => {
  it("abre el correo, y Copiar lo copia y avisa", async () => {
    const copied: string[] = []
    Object.assign(navigator, { clipboard: { writeText: (t: string) => { copied.push(t); return Promise.resolve() } } })
    render(<EmailContact email="hola@ola.uy" linkClassName="x" />)
    expect(screen.getByRole("link", { name: "hola@ola.uy" }).getAttribute("href")).toBe("mailto:hola@ola.uy")
    await act(() => { fireEvent.click(screen.getByRole("button", { name: "Copiar" })) })
    expect(copied).toEqual(["hola@ola.uy"])
    expect(screen.getByRole("button", { name: "¡Copiado! ✓" })).toBeTruthy()
  })
})
