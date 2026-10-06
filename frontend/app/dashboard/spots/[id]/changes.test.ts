import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api"
import { checkNewPhotos, describeFields, describeRequest, errorMessage, isStaySpot, joinLabels, contentTabLabel } from "./changes"
import type { ChangeRequest } from "./types"

const image = (name = "a.jpg", type = "image/jpeg", bytes = 1000) =>
  new File([new Uint8Array(bytes)], name, { type })

describe("joinLabels", () => {
  it("une con comas y una 'y' al final", () => {
    expect(joinLabels([])).toBe("")
    expect(joinLabels(["nombre"])).toBe("nombre")
    expect(joinLabels(["nombre", "precio"])).toBe("nombre y precio")
    expect(joinLabels(["nombre", "descripción", "precio"])).toBe("nombre, descripción y precio")
  })
})

describe("describeFields", () => {
  it("traduce los campos del backend y cuenta las fotos", () => {
    expect(describeFields(["name", "photos_added"], 2)).toBe("nombre y 2 fotos nuevas")
    expect(describeFields(["photos_added"], 1)).toBe("1 foto nueva")
  })

  it("muestra la temporada una sola vez", () => {
    expect(describeFields(["season_start", "season_end", "price"], 0)).toBe("temporada y precio")
  })
})

describe("describeRequest", () => {
  it("resume lo que tiene el pedido", () => {
    const req = {
      changes: { name: { from: "a", to: "b" }, photos_added: ["x", "y", "z"] },
    } as ChangeRequest
    expect(describeRequest(req)).toBe("nombre y 3 fotos nuevas")
  })
})

describe("checkNewPhotos", () => {
  it("acepta fotos que entran en el límite", () => {
    const files = [image(), image()]
    expect(checkNewPhotos(files, 8)).toEqual({ accepted: files, error: null })
  })

  it("si no entran todas, no acepta ninguna y dice cuántas borrar", () => {
    const { accepted, error } = checkNewPhotos([image(), image(), image(), image()], 8)
    expect(accepted).toEqual([])
    expect(error).toBe("El límite es 10 fotos por lugar. Tenés 8 y querés agregar 4: borrá al menos 2 para poder subirlas.")
  })

  it("descarta tipos y tamaños no permitidos y lo avisa", () => {
    const ok = image()
    const { accepted, error } = checkNewPhotos([ok, image("doc.pdf", "application/pdf"), image("big.jpg", "image/jpeg", 16 * 1024 * 1024)], 0)
    expect(accepted).toEqual([ok])
    expect(error).toMatch(/^2 archivos no se pudo agregar/)
  })

  it("los archivos descartados no cuentan para el límite", () => {
    const ok = image()
    const { accepted } = checkNewPhotos([ok, image("doc.pdf", "application/pdf")], 9)
    expect(accepted).toEqual([ok])
  })
})

describe("errorMessage", () => {
  it("muestra el detail del backend", () => {
    expect(errorMessage(new ApiError(409, "Ya tenés un cambio en revisión."), "x")).toBe("Ya tenés un cambio en revisión.")
  })

  it("un 422 (lista de errores de validación) usa el mensaje genérico", () => {
    expect(errorMessage(new ApiError(422, "[object Object]"), "No se pudo guardar.")).toBe("No se pudo guardar.")
  })

  it("un error que no es de la API usa el mensaje genérico", () => {
    expect(errorMessage(new TypeError("Failed to fetch"), "No se pudo guardar.")).toBe("No se pudo guardar.")
  })
})

describe("isStaySpot", () => {
  it("solo los alojamientos tienen experiencias", () => {
    expect(["Camping", "Glamping", "Motorhome"].every(isStaySpot)).toBe(true)
    expect(isStaySpot("Trekking")).toBe(false)
    expect(isStaySpot("Escalada")).toBe(false)
    expect(isStaySpot(null)).toBe(false)
  })
})

describe("contentTabLabel", () => {
  it("nombra la pestaña según qué se le puede sumar al lugar", () => {
    expect(contentTabLabel("Camping", false)).toBe("🧭 Experiencias")
    expect(contentTabLabel("Glamping", true)).toBe("🧭 Experiencias y alojamiento")
    expect(contentTabLabel("Trekking", false)).toBe("🥾 Rutas")
    expect(contentTabLabel("Escalada", false)).toBe("🧗 Sectores y vías")
    expect(contentTabLabel(null, false)).toBeNull()
  })
})
