import { describe, expect, it } from "vitest"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

// Un componente del servidor que importa un valor (no un componente, no un
// tipo) desde un archivo "use client" recibe una referencia, no el valor:
// así /lugares nunca cargó una foto de entrada (EAGER_CARDS no era un
// número). Este test lo frena en todo el proyecto.
const ROOTS = ["app", "components", "lib"]
const files = (dir: string): string[] => readdirSync(dir).flatMap(f => {
  const full = path.join(dir, f)
  return statSync(full).isDirectory() ? files(full) : /\.(tsx?|jsx?)$/.test(f) && !/\.test\./.test(f) ? [full] : []
})
const isClient = (file: string) => /^\s*["']use client["']/.test(readFileSync(file, "utf-8"))
const resolve = (from: string, spec: string) => {
  const base = spec.startsWith("@/") ? spec.slice(2) : spec.startsWith(".") ? path.join(path.dirname(from), spec) : null
  if (!base) return null
  for (const ext of ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"]) if (existsSync(base + ext) && statSync(base + ext).isFile()) return base + ext
  return null
}

describe("servidor y cliente", () => {
  it("ningún archivo del servidor importa valores sueltos desde un archivo de cliente", () => {
    const problems: string[] = []
    for (const file of ROOTS.flatMap(files)) {
      if (isClient(file)) continue
      const src = readFileSync(file, "utf-8")
      for (const m of src.matchAll(/import\s+(?!type\b)(?:\w+\s*,\s*)?\{([^}]*)\}\s+from\s+["']([^"']+)["']/g)) {
        const target = resolve(file, m[2])
        if (!target || !isClient(target)) continue
        // Los componentes (PascalCase, como SpotCard) y los tipos sí se pueden
        // importar; una constante en mayúsculas (EAGER_CARDS) es un valor.
        const isComponent = (name: string) => /^[A-Z][A-Za-z0-9]*$/.test(name) && /[a-z]/.test(name)
        const values = m[1].split(",").map(s => s.trim()).filter(s => s && !s.startsWith("type ") && !isComponent(s.split(/\s+as\s+/)[0]))
        if (values.length) problems.push(`${file}: ${values.join(", ")} desde ${m[2]}`)
      }
    }
    expect(problems).toEqual([])
  })
})
