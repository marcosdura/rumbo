import { describe, expect, it } from "vitest"
import { approachLabel } from "./sectorInfo"

describe("approachLabel", () => {
  it("minutos, horas, y null para no sé", () => {
    expect(approachLabel(15)).toBe("15 min")
    expect(approachLabel(60)).toBe("1 h")
    expect(approachLabel(90)).toBe("1 h 30 min")
    expect(approachLabel(120)).toBe("2 h o más")
    expect(approachLabel(null)).toBeNull()
  })
})
