import { describe, expect, it } from "vitest"
import { timeAgo } from "./timeAgo"

const NOW = Date.parse("2026-10-09T12:00:00Z")

describe("timeAgo", () => {
  it("las fechas sin zona del backend son UTC", () => {
    expect(timeAgo("2026-10-09T11:30:00", NOW)).toBe("hace 30 min")
    expect(timeAgo("2026-10-09T11:30:00Z", NOW)).toBe("hace 30 min")
  })

  it("ahora, horas y días", () => {
    expect(timeAgo("2026-10-09T11:59:40", NOW)).toBe("ahora")
    expect(timeAgo("2026-10-09T09:00:00", NOW)).toBe("hace 3 h")
    expect(timeAgo("2026-10-08T12:00:00", NOW)).toBe("hace 1 día")
    expect(timeAgo("2026-10-01T12:00:00", NOW)).toBe("hace 8 días")
  })
})
