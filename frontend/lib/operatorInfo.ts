// Datos de escuelas de surf y servicios de kayak para el visitante. Todos
// opcionales: null = "no sé" (quien lo cargó no lo sabía).

export const SURF_LEVELS: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
}

export const LANGUAGES: Record<string, string> = {
  espanol: "Español",
  ingles: "Inglés",
  portugues: "Portugués",
  otro: "Otro",
}

// "Principiante, Intermedio" — null si no se sabe.
export function listLabel(values: string[] | null | undefined, labels: Record<string, string>): string | null {
  if (!values || values.length === 0) return null
  return values.map(v => labels[v] ?? v).join(", ")
}

export function yesNo(value: boolean | null | undefined): string | null {
  return value == null ? null : value ? "Sí" : "No"
}
