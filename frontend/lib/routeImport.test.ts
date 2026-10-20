import { readFileSync } from "node:fs"
import { join } from "node:path"
import { readSheet } from "read-excel-file/node"
import { describe, expect, it } from "vitest"
import { MAX_ROWS, parseCsv, routeKey, rowsFromMatrix, TEMPLATE_HEADERS } from "./routeImport"

describe("leer la planilla de vías", () => {
  it("toma las columnas por su encabezado, sin importar mayúsculas, tildes ni orden", () => {
    const { rows, error } = rowsFromMatrix([
      ["CHAPAS", "Descripcion", "nombre", "Grado", "Tipo", "Largo (m)"],
      [9, "Placa", "La Diagonal", "6A", "Deportiva", 25],
    ])
    expect(error).toBeUndefined()
    expect(rows[0].row).toEqual({ name: "La Diagonal", grade: "6a", type: "deportiva", length: 25, bolts: 9, description: "Placa" })
    expect(rows[0].errors).toEqual([])
  })

  it("sin la columna Nombre, lo dice", () => {
    expect(rowsFromMatrix([["Grado"], ["6a"]]).error).toMatch(/Falta la columna "Nombre"/)
    expect(rowsFromMatrix([]).error).toBe("La planilla está vacía.")
    expect(rowsFromMatrix([["Nombre"]]).error).toMatch(/solo encabezados/)
  })

  it("marca cada error con su fila (la del archivo, para encontrarla)", () => {
    const { rows } = rowsFromMatrix([
      ["Nombre", "Grado", "Tipo", "Largo", "Chapas"],
      ["", "6a", "", "", ""],
      ["Uno", "11z", "escalera", "0", "-1"],
      ["Dos", "7b+", "trad", "30", "2.5"],
    ])
    expect(rows.map(r => r.line)).toEqual([2, 3, 4])
    expect(rows[0].errors).toEqual(["Falta el nombre"])
    expect(rows[1].errors).toHaveLength(4)
    expect(rows[2].errors).toEqual(["Chapas: tiene que ser un número entero entre 0 y 200"])
    expect(rows[2].row.type).toBe("tradicional")
  })

  it("las filas vacías no cuentan; las repetidas en el archivo se marcan", () => {
    const { rows } = rowsFromMatrix([["Nombre"], ["Uno"], [], ["", null], ["  uno "]])
    expect(rows.map(r => [r.row.name, r.repeated])).toEqual([["Uno", false], ["uno", true]])
  })

  it(`hasta ${MAX_ROWS} vías por vez`, () => {
    const many = [["Nombre"], ...Array.from({ length: MAX_ROWS + 1 }, (_, i) => [`V${i}`])]
    expect(rowsFromMatrix(many).error).toMatch(/máximo/)
  })

  it("el nombre se compara como en el backend", () => {
    expect(routeKey("  La   DIAGONAL ")).toBe(routeKey("la diagonal"))
  })
})

describe("CSV", () => {
  it("con ; o con , y campos entre comillas (con separadores y saltos adentro)", () => {
    expect(parseCsv('﻿Nombre;Descripción\r\nLa Diagonal;"Placa; fácil"\r\n')).toEqual([["Nombre", "Descripción"], ["La Diagonal", "Placa; fácil"]])
    expect(parseCsv('Nombre,Grado\n"El ""Techo""",7b\n"Dos\nlíneas",6a')).toEqual([["Nombre", "Grado"], ['El "Techo"', "7b"], ["Dos\nlíneas", "6a"]])
  })

  it("la planilla de ejemplo (public/vias-ejemplo.xlsx) se lee sin errores", async () => {
    const matrix = (await readSheet(readFileSync(join(process.cwd(), "public", "vias-ejemplo.xlsx")))) as unknown[][]
    expect(matrix[0]).toEqual([...TEMPLATE_HEADERS])
    const { rows, error } = rowsFromMatrix(matrix)
    expect(error).toBeUndefined()
    expect(rows.every(r => r.errors.length === 0)).toBe(true)
    expect(rows).toHaveLength(2)
  })
})
