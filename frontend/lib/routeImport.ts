// Importar vías de escalada desde una planilla (panel de admin, "Importar
// vías"). Lee las filas de un Excel o un CSV, las valida con las mismas
// reglas que el backend (backend/route_import.py) y dice cuáles son nuevas y
// cuáles actualizan una vía que ya está en el sector.

export type RouteType = "boulder" | "deportiva" | "tradicional"

export type ImportRow = {
  name: string
  grade?: string
  type?: RouteType
  length?: number
  bolts?: number
  description?: string
}

export type ParsedRow = { line: number; row: ImportRow; errors: string[]; repeated: boolean }

export const TEMPLATE_HEADERS = ["Nombre", "Grado", "Tipo", "Largo (m)", "Chapas", "Descripción"] as const
export const MAX_ROWS = 500
// Escala francesa: 3 a 9, letra opcional (a, b, c) y "+" opcional: 6a, 7b+, 5+.
const GRADE = /^[3-9][abc]?\+?$/

type Field = keyof ImportRow
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim()

// Cómo puede venir escrito cada encabezado.
const HEADERS: Record<Field, string[]> = {
  name: ["nombre", "via", "nombre de la via"],
  grade: ["grado", "dificultad"],
  type: ["tipo"],
  length: ["largo", "largo (m)", "largo m", "metros", "longitud"],
  bolts: ["chapas", "cintas"],
  description: ["descripcion", "notas"],
}

const TYPES: Record<string, RouteType> = {
  boulder: "boulder", bloque: "boulder",
  deportiva: "deportiva", deportivo: "deportiva",
  tradicional: "tradicional", trad: "tradicional", clasica: "tradicional",
}

// El nombre de una vía como lo compara el backend: sin importar mayúsculas
// ni espacios de más.
export const routeKey = (name: string) => name.split(/\s+/).filter(Boolean).join(" ").toLocaleLowerCase("es")

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim()

function integer(v: unknown, label: string, min: number, max: number, errors: string[]): number | undefined {
  const s = text(v)
  if (!s) return undefined
  const n = typeof v === "number" ? v : Number(s.replace(",", "."))
  if (!Number.isInteger(n) || n < min || n > max) {
    errors.push(`${label}: tiene que ser un número entero entre ${min} y ${max}`)
    return undefined
  }
  return n
}

// Las filas de la planilla (la primera con datos es la de encabezados).
export function rowsFromMatrix(matrix: unknown[][]): { rows: ParsedRow[]; error?: string } {
  const filled = matrix.map((cells, i) => ({ cells, line: i + 1 })).filter(r => r.cells.some(c => text(c)))
  if (filled.length === 0) return { rows: [], error: "La planilla está vacía." }
  const [head, ...body] = filled
  const columns = new Map<Field, number>()
  head.cells.forEach((cell, i) => {
    const h = fold(text(cell))
    const field = (Object.keys(HEADERS) as Field[]).find(f => HEADERS[f].includes(h))
    if (field && !columns.has(field)) columns.set(field, i)
  })
  if (!columns.has("name")) return { rows: [], error: `Falta la columna "Nombre". Los encabezados tienen que ser: ${TEMPLATE_HEADERS.join(", ")}.` }
  if (body.length === 0) return { rows: [], error: "La planilla no tiene vías (solo encabezados)." }
  if (body.length > MAX_ROWS) return { rows: [], error: `Son ${body.length} vías: el máximo por vez es ${MAX_ROWS}.` }

  const cell = (cells: unknown[], f: Field) => (columns.has(f) ? cells[columns.get(f)!] : undefined)
  const seen = new Set<string>()
  const rows = body.map(({ cells, line }) => {
    const errors: string[] = []
    const name = text(cell(cells, "name")).split(/\s+/).filter(Boolean).join(" ")
    if (!name) errors.push("Falta el nombre")
    else if (name.length > 200) errors.push("Nombre: hasta 200 caracteres")

    const row: ImportRow = { name }
    const grade = text(cell(cells, "grade")).toLowerCase()
    if (grade) {
      if (GRADE.test(grade)) row.grade = grade
      else errors.push(`Grado "${grade}": tiene que ser como 6a, 7b+ o 5`)
    }
    const type = text(cell(cells, "type"))
    if (type) {
      const t = TYPES[fold(type)]
      if (t) row.type = t
      else errors.push(`Tipo "${type}": tiene que ser boulder, deportiva o tradicional`)
    }
    const length = integer(cell(cells, "length"), "Largo", 1, 1000, errors)
    if (length !== undefined) row.length = length
    const bolts = integer(cell(cells, "bolts"), "Chapas", 0, 200, errors)
    if (bolts !== undefined) row.bolts = bolts
    const description = text(cell(cells, "description"))
    if (description) {
      if (description.length > 2000) errors.push("Descripción: hasta 2000 caracteres")
      else row.description = description
    }

    const key = routeKey(name)
    const repeated = !!name && seen.has(key)
    if (name) seen.add(key)
    return { line, row, errors, repeated }
  })
  return { rows }
}

// CSV: con ";" o "," (Excel en español guarda con ";"), campos entre comillas
// y sin el BOM del principio.
export function parseCsv(content: string): string[][] {
  const src = content.replace(/^﻿/, "")
  const firstLine = src.split(/\r?\n/, 1)[0] ?? ""
  const sep = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ";" : ","
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === sep) { row.push(field); field = "" }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++
      row.push(field); rows.push(row); row = []; field = ""
    } else field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows
}

// La planilla de ejemplo, lista para abrir en Excel (con ";" y BOM, así
// respeta las tildes).
export function templateCsv(): string {
  const lines = [
    TEMPLATE_HEADERS.join(";"),
    ["La Diagonal", "6a", "deportiva", "25", "9", "Placa con buenos agarres"].join(";"),
    ["El Techo", "7b+", "deportiva", "18", "7", ""].join(";"),
  ]
  return "﻿" + lines.join("\r\n") + "\r\n"
}
