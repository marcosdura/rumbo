import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import path from "node:path"

// La imagen al compartir un link de Rumbo cuando la página no tiene una foto
// propia (la home, legal, un lugar sin fotos). Antes salía sin imagen.
export const alt = "Rumbo: lugares al aire libre en Uruguay"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpengraphImage() {
  // favicon-192 y no RumboLogo.png: ese es un JPEG con extensión .png y
  // el generador de imágenes no lo lee.
  const logo = await readFile(path.join(process.cwd(), "public", "favicon-192.png"))
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 28,
          background: "linear-gradient(160deg, #1b4332 0%, #2d6a4f 65%, #40916c 100%)",
          color: "#fff", fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={120} height={120} style={{ borderRadius: 24 }} alt="" />
          <span style={{ fontSize: 110, fontWeight: 700, letterSpacing: -2 }}>rumbo</span>
        </div>
        <span style={{ fontSize: 44, color: "#b7e4c7" }}>Encontrá tu próxima aventura en Uruguay</span>
        <span style={{ fontSize: 30, color: "#95d5b2" }}>Camping · Trekking · Escalada · Surf · Kayak</span>
      </div>
    ),
    size,
  )
}
