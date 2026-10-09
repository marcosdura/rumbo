import { describe, expect, it } from "vitest"
import { gpxFileName, parseGpx, simplify, toGpx, type TrackPoint } from "./gpx"

const gpx = (body: string) => `<?xml version="1.0"?><gpx xmlns="http://www.topografix.com/GPX/1/1">${body}</gpx>`

describe("Leer el GPX", () => {
  it("los puntos del track, con altura si la tiene", () => {
    const text = gpx(`<trk><trkseg>
      <trkpt lat="-34.3" lon="-55.2"><ele>120.5</ele></trkpt>
      <trkpt lat="-34.31" lon="-55.21"></trkpt>
      <trkpt lat="x" lon="-55.2"></trkpt>
    </trkseg></trk>`)
    expect(parseGpx(text)).toEqual([[-34.3, -55.2, 120.5], [-34.31, -55.21, null]])
  })

  it("si no tiene track, los de la ruta (rtept)", () => {
    expect(parseGpx(gpx(`<rte><rtept lat="1" lon="2"/><rtept lat="3" lon="4"/></rte>`))).toEqual([[1, 2, null], [3, 4, null]])
  })

  it("no es un GPX o tiene menos de 2 puntos: null", () => {
    expect(parseGpx("hola")).toBeNull()
    expect(parseGpx(gpx(`<trk><trkseg><trkpt lat="1" lon="2"/></trkseg></trk>`))).toBeNull()
  })
})

describe("Simplificar", () => {
  it("hasta el máximo, siempre con el primero y el último", () => {
    const many: TrackPoint[] = Array.from({ length: 10001 }, (_, i) => [i, i, null])
    const out = simplify(many, 1500)
    expect(out).toHaveLength(1500)
    expect(out[0]).toEqual([0, 0, null])
    expect(out[1499]).toEqual([10000, 10000, null])
  })

  it("si entra, no lo toca", () => {
    const few: TrackPoint[] = [[1, 2, null], [3, 4, 5]]
    expect(simplify(few)).toBe(few)
  })
})

describe("Descargar GPX", () => {
  it("se arma de los puntos y se vuelve a leer igual", () => {
    const points: TrackPoint[] = [[-34.3, -55.2, 120], [-34.31, -55.21, null]]
    const text = toGpx("Cumbre <Norte> & Sur", points)
    expect(text).toContain("<name>Cumbre &lt;Norte&gt; &amp; Sur</name>")
    expect(parseGpx(text)).toEqual(points)
  })

  it("nombre del archivo", () => {
    expect(gpxFileName("cumbre", "Cumbre")).toBe("cumbre.gpx")
    expect(gpxFileName(null, "Subida al Pan de Azúcar")).toBe("subida-al-pan-de-azucar.gpx")
  })
})
