export function formatStat(value: number | string | null | undefined, unit = "", prefix = ""): string {
  if (value === null || value === undefined || value === "") return "Sin datos"
  return `${prefix}${value}${unit}`
}
