import { describe, expect, it, vi } from "vitest"

vi.mock("next/font/google", () => ({ Nunito: () => ({ variable: "" }), DM_Sans: () => ({ variable: "" }) }))
vi.mock("@next/third-parties/google", () => ({ GoogleAnalytics: () => null }))
vi.mock("@/components/layout/Providers", () => ({ default: () => null }))

const { metadata } = await import("./layout")

describe("Metadatos de todo el sitio", () => {
  it("las direcciones relativas se completan con rumboapp.uy (antes no había metadataBase)", () => {
    expect(String(metadata.metadataBase)).toBe("https://rumboapp.uy/")
  })

  it("al compartir, por defecto la imagen de Rumbo y tarjeta grande", () => {
    expect((metadata.openGraph?.images as { url: string }[])[0].url).toBe("/opengraph-image")
    expect((metadata.twitter as { card: string }).card).toBe("summary_large_image")
  })
})

describe("Fuentes", () => {
  it("sin Playfair Display: los títulos usan DM Sans en negrita (como los nombres de las cards)", async () => {
    const { readFileSync, readdirSync, statSync } = await import("node:fs")
    const path = await import("node:path")
    const files = (dir: string): string[] => readdirSync(dir).flatMap(f => {
      const full = path.join(dir, f)
      return statSync(full).isDirectory() ? files(full) : /\.(tsx?|jsx|css)$/.test(f) && !/\.test\./.test(f) ? [full] : []
    })
    const using = ["app", "components", "lib"].flatMap(files).filter(f => readFileSync(f, "utf-8").includes("--font-playfair-display"))
    expect(using).toEqual([])
    expect(readFileSync("app/layout.tsx", "utf-8")).not.toContain("Playfair_Display")
  })
})
