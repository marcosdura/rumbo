import { describe, expect, it } from "vitest"
import { badgeText, notificationIcon, timeAgo } from "./notifications"

const NOW = Date.parse("2026-10-06T12:00:00Z")

describe("timeAgo", () => {
  it("acepta fechas con zona horaria (notificaciones)", () => {
    expect(timeAgo("2026-10-06T11:30:00+00:00", NOW)).toBe("hace 30 min")
    expect(timeAgo("2026-10-06T09:00:00Z", NOW)).toBe("hace 3h")
  })

  it("y sin zona (las reseñas): las toma como UTC", () => {
    expect(timeAgo("2026-10-06T11:59:30", NOW)).toBe("ahora")
    expect(timeAgo("2026-10-04T12:00:00", NOW)).toBe("hace 2 días")
  })

  it("sin fecha, nada", () => {
    expect(timeAgo(null, NOW)).toBe("")
  })
})

describe("notificationIcon", () => {
  it("según el tipo de aviso", () => {
    expect(notificationIcon("spot_approved")).toBe("✅")
    expect(notificationIcon("change_rejected")).toBe("⚠️")
    expect(notificationIcon("new_review")).toBe("⭐")
    expect(notificationIcon("admin_report")).toBe("🛠️")
  })
})

describe("badgeText", () => {
  it("tope en 9+", () => {
    expect(badgeText(3)).toBe("3")
    expect(badgeText(12)).toBe("9+")
  })
})
