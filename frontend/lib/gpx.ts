// El recorrido de una ruta de trekking: se lee el GPX en el navegador (lo
// exportan Wikiloc, Strava, Garmin y las apps de celular), se simplifica y
// se manda como puntos (backend/route_tracks.py valida y calcula distancia
// y desnivel). "Descargar GPX" lo vuelve a armar desde los puntos.

export type TrackPoint = [number, number, number | null]

export const MAX_TRACK_POINTS = 1500

// Los puntos del track (<trkpt>); si no tiene, los de la ruta (<rtept>).
// null si no es un GPX o no tiene al menos 2 puntos.
export function parseGpx(text: string): TrackPoint[] | null {
  const doc = new DOMParser().parseFromString(text, "application/xml")
  if (doc.getElementsByTagName("parsererror").length > 0) return null
  let nodes = Array.from(doc.getElementsByTagName("trkpt"))
  if (nodes.length === 0) nodes = Array.from(doc.getElementsByTagName("rtept"))
  const points: TrackPoint[] = []
  for (const n of nodes) {
    const lat = parseFloat(n.getAttribute("lat") ?? "")
    const lng = parseFloat(n.getAttribute("lon") ?? "")
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const eleText = n.getElementsByTagName("ele")[0]?.textContent
    const ele = eleText != null ? parseFloat(eleText) : NaN
    points.push([lat, lng, Number.isFinite(ele) ? ele : null])
  }
  return points.length >= 2 ? points : null
}

// Hasta `max` puntos, salteando parejo y siempre con el primero y el último.
// Un GPX de una salida larga trae decenas de miles: para el mapa sobra.
export function simplify(points: TrackPoint[], max = MAX_TRACK_POINTS): TrackPoint[] {
  if (points.length <= max) return points
  const step = (points.length - 1) / (max - 1)
  return Array.from({ length: max }, (_, i) => points[Math.round(i * step)])
}

const escapeXml = (s: string) => s.replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!)

export function toGpx(name: string, points: TrackPoint[]): string {
  const pts = points
    .map(([lat, lng, ele]) => `      <trkpt lat="${lat}" lon="${lng}">${ele != null ? `<ele>${ele}</ele>` : ""}</trkpt>`)
    .join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Rumbo" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>
${pts}
    </trkseg>
  </trk>
</gpx>
`
}

// "cumbre-del-cerro.gpx"
export function gpxFileName(slug: string | null, name: string): string {
  const base = slug || name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  return `${base || "recorrido"}.gpx`
}
