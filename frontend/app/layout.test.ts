import { describe, expect, it, vi } from "vitest"

vi.mock("next/font/google", () => ({ Nunito: () => ({ variable: "" }), Playfair_Display: () => ({ variable: "" }), DM_Sans: () => ({ variable: "" }) }))
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
