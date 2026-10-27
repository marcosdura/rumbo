import { describe, expect, it } from "vitest"
import { cardinal, dayLabel, decimal, weatherOf } from "./forecast"

describe("pronóstico: cómo se dice cada cosa", () => {
  it("el clima según el código WMO", () => {
    expect(weatherOf(0)).toEqual({ emoji: "☀️", label: "Despejado" })
    expect(weatherOf(63)).toEqual({ emoji: "🌧️", label: "Lluvia" })
    expect(weatherOf(95).label).toBe("Tormenta")
    expect(weatherOf(1234)).toEqual({ emoji: "🌡️", label: "Sin dato" })
  })

  it("de dónde viene el viento", () => {
    expect([0, 44, 46, 90, 180, 225, 270, 315, 359, -45].map(cardinal)).toEqual(["N", "NE", "NE", "E", "S", "SO", "O", "NO", "N", "NO"])
    expect(cardinal(null)).toBe("")
  })

  it("hoy, mañana, y después el día de la semana", () => {
    const today = new Date(2026, 9, 27) // martes 27/10/2026
    expect(dayLabel("2026-10-27", today)).toBe("Hoy")
    expect(dayLabel("2026-10-28", today)).toBe("Mañana")
    expect(dayLabel("2026-10-29", today)).toBe("Jue 29")
    // Fin de mes.
    expect(dayLabel("2026-11-01", new Date(2026, 9, 31))).toBe("Mañana")
  })

  it("decimales con coma", () => {
    expect(decimal(1.2)).toBe("1,2")
    expect(decimal(2)).toBe("2")
  })
})
