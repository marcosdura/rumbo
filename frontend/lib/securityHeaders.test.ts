import { describe, expect, it } from "vitest"
import { contentSecurityPolicy, securityHeaders } from "./securityHeaders"

const directive = (csp: string, name: string) => csp.split("; ").find(d => d.startsWith(name + " "))?.split(" ").slice(1) ?? []

describe("cabeceras de seguridad", () => {
  it("nadie puede meter el sitio en un iframe", () => {
    const headers = Object.fromEntries(securityHeaders("https://api.rumbo.app").map(h => [h.key, h.value]))
    expect(headers["X-Frame-Options"]).toBe("DENY")
    expect(directive(headers["Content-Security-Policy"], "frame-ancestors")).toEqual(["'none'"])
    expect(headers["X-Content-Type-Options"]).toBe("nosniff")
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin")
    expect(headers["Permissions-Policy"]).toContain("camera=()")
  })

  it("los datos solo pueden ir al propio sitio, la API, Cloudinary y Analytics", () => {
    const connect = directive(contentSecurityPolicy("https://api.rumbo.app/v1"), "connect-src")
    expect(connect).toContain("https://api.rumbo.app")
    expect(connect).toContain("https://api.cloudinary.com")
    expect(connect).not.toContain("*")
    expect(connect.every(s => s === "'self'" || s.startsWith("https://"))).toBe(true)
  })

  it("los scripts solo del propio sitio, Analytics y la librería de compresión; sin eval en producción", () => {
    const scripts = directive(contentSecurityPolicy(undefined), "script-src")
    expect(scripts).not.toContain("'unsafe-eval'")
    expect(scripts).toContain("https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/")
    expect(scripts.filter(s => s.startsWith("https://"))).toHaveLength(2)
    expect(directive(contentSecurityPolicy(undefined, true), "script-src")).toContain("'unsafe-eval'")
  })

  it("sin plugins ni cambio de la dirección base", () => {
    const csp = contentSecurityPolicy(undefined)
    expect(directive(csp, "object-src")).toEqual(["'none'"])
    expect(directive(csp, "base-uri")).toEqual(["'self'"])
  })

  it("con una dirección de API inválida, no la agrega (y no rompe)", () => {
    expect(directive(contentSecurityPolicy("no es url"), "connect-src")[0]).toBe("'self'")
  })
})
