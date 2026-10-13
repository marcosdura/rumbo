import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import JsonLd, { safeJson } from "./JsonLd"

describe("JsonLd", () => {
  it("un </script> en un texto de usuario no cierra el bloque (antes dejaba meter código)", () => {
    const evil = { description: '</script><script>alert("x")</script>' }
    const { container } = render(<JsonLd data={evil} />)
    expect(container.querySelectorAll("script")).toHaveLength(1)
    expect(container.innerHTML).not.toContain("</script><script>")
  })

  it("el JSON sigue siendo el mismo al leerlo", () => {
    const separator = String.fromCharCode(0x2028)
    const data = { name: "Cabo <Polonio>", text: `línea${separator}otra` }
    const json = safeJson(data)
    expect(JSON.parse(json)).toEqual(data)
    expect(json).not.toContain("<")
    expect(json).not.toContain(separator)
  })
})
