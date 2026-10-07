import { describe, expect, it } from "vitest"
import { heroTagline } from "./home"

describe("heroTagline", () => {
  it("con datos reales, en singular o plural", () => {
    expect(heroTagline({ spots: 42, departments: 7 })).toBe("42 lugares para descubrir en 7 departamentos")
    expect(heroTagline({ spots: 1, departments: 1 })).toBe("1 lugar para descubrir en 1 departamento")
  })

  it("sin lugares (o sin datos), un texto general", () => {
    expect(heroTagline({ spots: 0, departments: 0 })).toBe("Camping, trekking, escalada, surf y más, en todo Uruguay")
    expect(heroTagline(null)).toBe("Camping, trekking, escalada, surf y más, en todo Uruguay")
  })
})
