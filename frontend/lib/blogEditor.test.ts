import { describe, expect, it } from "vitest"
import {
  draftSpotIds, effectiveSlug, emptyDraft, freePoint, fromSaved, move, newBlock, parseCoords,
  removePoint, removeTrack, sameContent, toPayload, uniqueId, withKey, type SavedPost,
} from "./blogEditor"

const saved: SavedPost = {
  id: 1, slug: "refugios", title: "Refugios", summary: null, cover_image: null, category: "refugios",
  region: null, status: "draft", featured: false, published_at: null, updated_at: null, spots: {},
  map: {
    points: [{ id: "a", spot_id: 7, note: null }, { id: "frey", name: "Frey", type: "refugio", lat: -41, lng: -71, note: null, image: null, url: null }],
    tracks: [{ id: "ida", name: "Ida", points: [[-41, -71, 1000], [-41.1, -71.1, 1200]], distance_km: 12, elevation_gain: 200, elevation_loss: 0 }],
  },
  blocks: [{ type: "point", point: "frey", text: "Subís **mucho**" }, { type: "gpx", track: "ida" }, { type: "spot", spot_id: 9 }],
}

describe("lo que se manda al backend", () => {
  it("sin las claves de edición ni los datos que calcula el backend", () => {
    const payload = toPayload(fromSaved(saved), "published")
    expect(payload.status).toBe("published")
    expect(payload.blocks[0]).toEqual({ type: "point", point: "frey", text: "Subís **mucho**" })
    expect(payload.map?.tracks[0]).toEqual({ id: "ida", name: "Ida", points: saved.map!.tracks[0].points })
    expect(payload.summary).toBeNull()
  })

  it("una nota sin puntos ni recorridos va sin mapa; el slug vacío lo arma el backend", () => {
    const payload = toPayload({ ...emptyDraft(), title: "Qué llevar" })
    expect(payload.map).toBeNull()
    expect(payload.slug).toBeNull()
    expect(effectiveSlug({ ...emptyDraft(), title: "Qué llevar a la montaña" })).toBe("que-llevar-a-la-montana")
  })

  it("lo editado se compara con lo guardado por contenido, no por las claves", () => {
    const a = fromSaved(saved)
    expect(sameContent(a, fromSaved(saved))).toBe(true)
    expect(sameContent(a, { ...a, title: "Otro" })).toBe(false)
  })
})

describe("puntos del mapa", () => {
  it("el id sale del nombre y no se repite", () => {
    expect(uniqueId("Refugio Frey", [])).toBe("refugio-frey")
    expect(uniqueId("Refugio Frey", ["refugio-frey", "refugio-frey-2"])).toBe("refugio-frey-3")
    expect(uniqueId("¡¿?!", [])).toBe("punto")
    expect(freePoint(" Laguna Negra ", "agua", -41, -71, []).id).toBe("laguna-negra")
  })

  it("lee coordenadas pegadas de Google Maps", () => {
    expect(parseCoords("-41.1834, -71.4721")).toEqual({ lat: -41.1834, lng: -71.4721 })
    expect(parseCoords("https://www.google.com/maps/place/Refugio/@-41.18345,-71.47211,15z")).toEqual({ lat: -41.18345, lng: -71.47211 })
    expect(parseCoords("-34.5 -55.2")).toEqual({ lat: -34.5, lng: -55.2 })
    expect(parseCoords("hola")).toBeNull()
    expect(parseCoords("95, 10")).toBeNull()
  })

  it("sacar un punto deja su texto como texto común", () => {
    const draft = removePoint(fromSaved(saved), "frey")
    expect(draft.points.map(p => p.id)).toEqual(["a"])
    expect(draft.blocks[0]).toMatchObject({ type: "text", text: "Subís **mucho**" })
    const empty = removePoint({ ...fromSaved(saved), blocks: [withKey({ type: "point", point: "frey", text: null })] }, "frey")
    expect(empty.blocks).toEqual([])
  })

  it("sacar un recorrido saca su bloque de GPX", () => {
    const draft = removeTrack(fromSaved(saved), "ida")
    expect(draft.tracks).toEqual([])
    expect(draft.blocks.map(b => b.type)).toEqual(["point", "spot"])
  })

  it("los lugares de Rumbo que nombra, sin repetir", () => {
    expect(draftSpotIds(fromSaved(saved))).toEqual([7, 9])
  })
})

describe("bloques", () => {
  it("mover dentro de la lista, sin salirse", () => {
    expect(move([1, 2, 3], 0, 1)).toEqual([2, 1, 3])
    expect(move([1, 2, 3], 2, 1)).toEqual([1, 2, 3])
  })

  it("un bloque de punto nuevo toma el primer punto sin sección", () => {
    const draft = fromSaved(saved)
    expect(newBlock("point", draft)).toMatchObject({ type: "point", point: "a" })
    expect(newBlock("gpx", draft)).toMatchObject({ type: "gpx", track: "ida" })
    expect(newBlock("text", draft).key).not.toBe(newBlock("text", draft).key)
  })
})
