// Datos de un sector de escalada para el visitante: aproximación, sol o
// sombra, tipo de roca. Todos opcionales: null = "no sé" (quien lo cargó no
// lo sabía). Los usan el formulario de agregar-lugar y la página del sector.

export const SUN_EXPOSURE: Record<string, string> = {
  sol: "Sol",
  sombra: "Sombra",
  mixto: "Sol y sombra",
}

export const ROCK_TYPES: Record<string, string> = {
  granito: "Granito",
  basalto: "Basalto",
  arenisca: "Arenisca",
  cuarcita: "Cuarcita",
  caliza: "Caliza",
  otra: "Otra",
}

// Minutos de caminata hasta el sector (opciones del formulario).
export const APPROACH_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120]

export function approachLabel(minutes: number | null | undefined): string | null {
  if (minutes == null) return null
  if (minutes >= 120) return "2 h o más"
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}
