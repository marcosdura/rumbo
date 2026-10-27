// El pronóstico de un lugar (GET /spots/{id}/forecast, de Open-Meteo): los
// textos y emojis de cada día.

export type ForecastDay = {
  date: string // "2026-10-27", día local de Uruguay
  code: number // código de clima WMO
  max: number | null
  min: number | null
  rain: number | null // probabilidad de lluvia, %
  wind: number | null // km/h
  wind_dir: number | null // grados, de dónde viene
  waves: { height: number | null; period: number | null; dir: number | null } | null
}
export type Forecast = { days: ForecastDay[]; source: string }

// Códigos WMO (https://open-meteo.com/en/docs): el emoji y cómo se dice.
const WEATHER: [number[], string, string][] = [
  [[0], "☀️", "Despejado"],
  [[1], "🌤️", "Mayormente despejado"],
  [[2], "⛅", "Parcialmente nublado"],
  [[3], "☁️", "Nublado"],
  [[45, 48], "🌫️", "Niebla"],
  [[51, 53, 55, 56, 57], "🌦️", "Llovizna"],
  [[61, 63, 66], "🌧️", "Lluvia"],
  [[65, 67], "🌧️", "Lluvia fuerte"],
  [[71, 73, 75, 77, 85, 86], "🌨️", "Nieve"],
  [[80, 81], "🌦️", "Chaparrones"],
  [[82], "🌧️", "Chaparrones fuertes"],
  [[95], "⛈️", "Tormenta"],
  [[96, 99], "⛈️", "Tormenta con granizo"],
]

export function weatherOf(code: number): { emoji: string; label: string } {
  const hit = WEATHER.find(([codes]) => codes.includes(code))
  return hit ? { emoji: hit[1], label: hit[2] } : { emoji: "🌡️", label: "Sin dato" }
}

// De dónde viene el viento o la ola: N, NE, E...
const POINTS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"]
export function cardinal(deg: number | null): string {
  if (deg == null) return ""
  return POINTS[Math.round((((deg % 360) + 360) % 360) / 45) % 8]
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

// "Hoy", "Mañana", y después "Jue 30".
export function dayLabel(date: string, today = new Date()): string {
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  if (date === iso(today)) return "Hoy"
  if (date === iso(tomorrow)) return "Mañana"
  const [y, m, d] = date.split("-").map(Number)
  const weekday = new Date(y, m - 1, d).toLocaleDateString("es-UY", { weekday: "short" }).replace(".", "")
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${d}`
}

// "1,2 m": con coma, como se escribe acá.
export const decimal = (n: number) => n.toLocaleString("es-UY", { maximumFractionDigits: 1 })
