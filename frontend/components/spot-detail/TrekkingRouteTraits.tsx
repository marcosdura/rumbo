"use client"

// Las características de una ruta (dificultad, circular, nivel técnico y
// físico) como pills sueltas: van en la misma fila que sus datos (distancia,
// duración...). Antes eran una tarjeta aparte, lejos de los datos.
import Pill, { type PillVariant } from "@/components/ui/Pill"

const DIFFICULTY_CONFIG: Record<string, { variant: PillVariant; dot: string }> = {
  "fácil":    { variant: "green",  dot: "🟢" },
  "moderado": { variant: "yellow", dot: "🟡" },
  "difícil":  { variant: "red",    dot: "🔴" },
}

const LEVEL_VARIANT: Record<string, PillVariant> = { "bajo": "green", "medio": "yellow", "alto": "red" }

export type RouteTraitsData = {
  difficulty?: string | null
  route_type?: string | null
  technical_level?: string | null
  physical_demand?: string | null
}

export default function TrekkingRouteTraits({ route }: { route: RouteTraitsData | null }) {
  if (!route) return null

  const items: { variant: PillVariant; label: string }[] = []

  if (route.difficulty) {
    const conf = DIFFICULTY_CONFIG[route.difficulty]
    const label = route.difficulty.charAt(0).toUpperCase() + route.difficulty.slice(1)
    items.push({ variant: conf?.variant || "white", label: conf ? `${conf.dot} ${label}` : label })
  }

  if (route.route_type) {
    items.push({ variant: "white", label: `${route.route_type === "circular" ? "🔁" : "↩️"} ${route.route_type}` })
  }

  if (route.technical_level) {
    items.push({ variant: LEVEL_VARIANT[route.technical_level] || "white", label: `🧗 Técnico: ${route.technical_level}` })
  }

  if (route.physical_demand) {
    items.push({ variant: LEVEL_VARIANT[route.physical_demand] || "white", label: `💪 Físico: ${route.physical_demand}` })
  }

  if (items.length === 0) return null

  return items.map((item, i) => (
    <Pill key={i} variant={item.variant} size="lg" hover>{item.label}</Pill>
  ))
}
