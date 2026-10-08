import { describe, expect, it } from "vitest"
import { EMPTY_SUMMARY, memberSince, menuRows, summaryLine } from "./profile"

const summary = {
  ...EMPTY_SUMMARY, member_since: "2025-03-14T10:00:00",
  favorites: 8, reviews: 1, managed: 2, managed_rejected: 1, suggested: 1,
  contributions: 3, contributions_pending: 2, requests: 1, requests_pending: 0,
}

describe("memberSince", () => {
  it("la fecha de registro, no la de hoy", () => {
    expect(memberSince("2025-03-14T10:00:00")).toBe("marzo de 2025")
    expect(memberSince(null)).toBeNull()
    expect(memberSince("cualquier cosa")).toBeNull()
  })
})

describe("summaryLine", () => {
  it("solo lo que tiene algo, en singular o plural", () => {
    expect(summaryLine(summary)).toBe("8 favoritos · 1 reseña · 3 lugares · 3 aportes")
  })

  it("sin nada, no hay línea", () => {
    expect(summaryLine(EMPTY_SUMMARY)).toBeNull()
  })
})

describe("menuRows", () => {
  it("las cinco secciones, con números y lo que pide atención", () => {
    const rows = menuRows(summary)
    expect(rows.map(r => [r.title, r.href, r.count, r.badge?.text ?? null])).toEqual([
      ["Favoritos", "/favorites", 8, null],
      ["Mis reseñas", "/reviews", 1, null],
      ["Lugares que administrás", "/profile/lugares", 3, "1 rechazado"],
      ["Mis aportes", "/profile/aportes", 3, "2 en revisión"],
      ["Mis pedidos", "/profile/pedidos", 1, null],
    ])
  })

  it("con 0, las filas siguen y explican para qué son", () => {
    const rows = menuRows(EMPTY_SUMMARY)
    expect(rows).toHaveLength(5)
    expect(rows.find(r => r.title === "Lugares que administrás")!.hint).toBe("Todavía no cargaste ningún lugar")
  })
})
