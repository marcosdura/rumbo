import { describe, expect, it } from "vitest"
import { isValidElement, type ReactElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import GlobalError from "./global-error"

// Arma su propio <html>: se prueba el HTML que genera, sin montarlo en jsdom.
const find = (node: ReactNode, type: string): ReactElement<{ onClick?: () => void }> | null => {
  if (!isValidElement(node)) return Array.isArray(node) ? node.map(n => find(n, type)).find(Boolean) ?? null : null
  if (node.type === type) return node as ReactElement<{ onClick?: () => void }>
  return find((node.props as { children?: ReactNode }).children, type)
}

describe("Error de último recurso (falló el layout)", () => {
  it("página entera en español, con salida al inicio y sin depender del layout", () => {
    const html = renderToStaticMarkup(<GlobalError error={new Error("Error 500")} unstable_retry={() => {}} />)
    expect(html).toContain('<html lang="es">')
    expect(html).toContain("Algo salió mal")
    expect(html).toContain('<a href="/"')
    expect(html).not.toContain("var(--")
    expect(html).not.toContain("Error 500")
  })

  it("Reintentar vuelve a intentar", () => {
    let retries = 0
    const tree = GlobalError({ error: new Error("x"), unstable_retry: () => { retries++ } })
    find(tree, "button")!.props.onClick!()
    expect(retries).toBe(1)
  })
})
