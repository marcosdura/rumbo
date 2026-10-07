import { describe, expect, it } from "vitest"
import { LANGUAGES, SURF_LEVELS, listLabel, yesNo } from "./operatorInfo"

describe("operatorInfo", () => {
  it("listLabel: etiquetas separadas por coma, null si no se sabe", () => {
    expect(listLabel(["principiante", "avanzado"], SURF_LEVELS)).toBe("Principiante, Avanzado")
    expect(listLabel(["ingles"], LANGUAGES)).toBe("Inglés")
    expect(listLabel(null, LANGUAGES)).toBeNull()
    expect(listLabel([], LANGUAGES)).toBeNull()
  })

  it("yesNo: null si no se sabe", () => {
    expect(yesNo(true)).toBe("Sí")
    expect(yesNo(false)).toBe("No")
    expect(yesNo(null)).toBeNull()
  })
})
