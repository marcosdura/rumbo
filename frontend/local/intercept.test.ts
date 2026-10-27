// @vitest-environment node
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { findPhoto, fileNameFor, loginPage, parseUpload, placeholderSvg, publicIdFromUrl, safeCallback, saveUpload } from "./intercept.mjs"
import { notIgnored, WRITES } from "./run.mjs"

const FRONT = "http://localhost:3200"

// Como la arma el navegador con el FormData de lib/uploadImage.ts.
async function multipart(fields: Record<string, string>, file: Blob) {
  const form = new FormData()
  form.append("file", file, "foto.jpg")
  for (const [k, v] of Object.entries(fields)) form.append(k, v)
  const req = new Request("http://x", { method: "POST", body: form })
  return { body: Buffer.from(await req.arrayBuffer()), type: req.headers.get("content-type")! }
}

describe("Rumbo en local: nada va al repo", () => {
  it("la base, las fotos y el build del modo local están en el .gitignore", () => {
    expect(notIgnored(WRITES)).toEqual([])
    expect(WRITES.some(p => p.startsWith(".rumbo-local/fotos/"))).toBe(true)
  })

  it("y detecta lo que no lo está", () => {
    expect(notIgnored(["local/run.mjs"])).toEqual(["local/run.mjs"])
  })
})

describe("Rumbo en local: las fotos se quedan en la compu", () => {
  it("una subida se guarda en la carpeta y se vuelve a servir por su id", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rumbo-local-"))
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3, 13, 10, 45, 45])
    const { body, type } = await multipart({ public_id: "12/abcdef0123456789", folder: "rumbo/spots", api_key: "x" }, new Blob([bytes], { type: "image/jpeg" }))
    const upload = parseUpload(body, type)
    expect(upload?.publicId).toBe("rumbo/spots/12/abcdef0123456789")
    expect(saveUpload(dir, upload)).toBe(true)
    expect(fs.readdirSync(dir)).toEqual(["rumbo__spots__12__abcdef0123456789.jpg"])

    const url = "https://res.cloudinary.com/rumbo-local/image/upload/c_fill,w_640/f_auto/q_auto/v1/rumbo/spots/12/abcdef0123456789?_a=BAV"
    const photo = findPhoto(dir, publicIdFromUrl(url)!)
    expect(photo?.contentType).toBe("image/jpeg")
    expect([...photo!.body]).toEqual([...bytes])
  })

  it("no escribe fuera de la carpeta ni guarda lo que no es imagen", async () => {
    expect(fileNameFor("rumbo/../../.git/config")).toBeNull()
    expect(fileNameFor("rumbo/spots/1/abc")).toBe("rumbo__spots__1__abc")
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rumbo-local-"))
    const { body, type } = await multipart({ public_id: "1/abc", folder: "rumbo/spots" }, new Blob(["<script>"], { type: "text/html" }))
    expect(saveUpload(dir, parseUpload(body, type))).toBe(false)
    expect(fs.readdirSync(dir)).toEqual([])
  })

  it("las de ejemplo se dibujan con el nombre del lugar", () => {
    expect(publicIdFromUrl("https://res.cloudinary.com/x/image/upload/v1/rumbo/demo/cerro-arequita-2.png")).toBe("rumbo/demo/cerro-arequita-2")
    expect(publicIdFromUrl("https://res.cloudinary.com/x/image/upload/v1/otra/cosa")).toBeNull()
    const svg = placeholderSvg("rumbo/demo/cerro-arequita-2")
    expect(svg).toContain(">cerro arequita<")
    expect(placeholderSvg("rumbo/demo/<b>-1")).toContain("&#60;b&#62;")
  })
})

describe("Rumbo en local: entrar sin Google", () => {
  it("ofrece las cuentas de ejemplo y vuelve a la página de donde vino", () => {
    const html = loginPage([{ email: "ana@rumbo.local", label: "Ana" }], `${FRONT}/spots/x`)
    expect(html).toContain("/__local/entrar?como=ana%40rumbo.local&#38;callbackUrl=http%3A%2F%2Flocalhost%3A3200%2Fspots%2Fx")
  })

  it("solo vuelve a páginas del sitio local", () => {
    expect(safeCallback("/favorites", FRONT)).toBe(`${FRONT}/favorites`)
    expect(safeCallback("https://evil.example/x", FRONT)).toBe(FRONT)
    expect(safeCallback(null, FRONT)).toBe(`${FRONT}/`)
  })
})
