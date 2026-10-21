import { describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { fieldsFrom, payloadFrom, useSpotForm } from "./useSpotForm"
import type { Spot } from "./types"

const spot = (extra: Partial<Spot> = {}) => ({
  id: 7, name: "Cerro", description: "Lindo", email: null, whatsapp: "099", instagram: null, price: 300,
  season_start: null, season_end: null, is_public: true, public_transport: null,
  pets_allowed: true, reservation_required: null, cell_signal: false, images: [], ...extra,
}) as unknown as Spot

describe("los campos del panel del dueño", () => {
  it("lo vacío se manda como null, y la temporada solo si es por temporada", () => {
    expect(payloadFrom(fieldsFrom(spot()))).toEqual({
      name: "Cerro", description: "Lindo", email: null, whatsapp: "099", instagram: null, price: 300,
      season_start: null, season_end: null, is_public: true, public_transport: null,
      pets_allowed: true, reservation_required: null, cell_signal: false,
    })
    const seasonal = payloadFrom({ ...fieldsFrom(spot({ season_start: 11, season_end: 3 })), price: "" })
    expect(seasonal).toMatchObject({ season_start: 11, season_end: 3, price: null })
    expect(payloadFrom({ ...fieldsFrom(spot({ season_start: 11, season_end: 3 })), seasonType: "all_year" })).toMatchObject({ season_start: null, season_end: null })
  })

  it("sabe si hay cambios sin guardar: al escribir, al mover el punto y no al cargar", () => {
    const { result } = renderHook(() => useSpotForm())
    act(() => result.current.populate(spot()))
    expect(result.current.changed).toBe(false)
    expect(result.current.infoProps.editName).toBe("Cerro")

    act(() => result.current.infoProps.setEditName("Cerro Arequita"))
    expect(result.current.changed).toBe(true)
    act(() => result.current.infoProps.setEditName("Cerro"))
    expect(result.current.changed).toBe(false)

    act(() => result.current.infoProps.setEditPractical("cell_signal", true))
    expect(result.current.buildPayload()).toMatchObject({ cell_signal: true })
    act(() => result.current.infoProps.setEditPractical("cell_signal", false))

    act(() => result.current.setNewLocation([-34.6, -55.2]))
    expect(result.current.changed).toBe(true)
    expect(result.current.buildPayload()).toMatchObject({ lat: -34.6, lng: -55.2 })
  })
})
