import { describe, expect, it, vi } from "vitest"

vi.mock("next-auth/jwt", () => ({ getToken: async () => null }))
const { config, redirectFor } = await import("./proxy")

describe("proxy", () => {
  it("admin: solo el email autorizado", () => {
    expect(redirectFor("/admin", null, "admin@x.com")).toBe("/")
    expect(redirectFor("/admin", "otra@x.com", "admin@x.com")).toBe("/")
    expect(redirectFor("/admin", "admin@x.com", "admin@x.com")).toBeNull()
    // Sin ADMIN_EMAIL configurado no entra nadie.
    expect(redirectFor("/admin", "otra@x.com", undefined)).toBe("/")
  })

  it("perfil: con sesión", () => {
    expect(redirectFor("/profile/aportes", null, "admin@x.com")).toBe("/")
    expect(redirectFor("/profile/aportes", "ana@x.com", "admin@x.com")).toBeNull()
  })

  it("solo corre en las rutas que protege, no en cada request", () => {
    expect(config.matcher).toEqual(["/admin/:path*", "/profile/:path*"])
  })
})
