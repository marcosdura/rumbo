// Lo común de las pruebas en el navegador: el navegador, la sesión de prueba,
// Cloudinary simulado y el registro de resultados.
import { chromium } from "playwright-core"
import { encode } from "next-auth/jwt"
import fs from "node:fs"
import path from "node:path"

export const FRONT = process.env.E2E_FRONT ?? "http://localhost:3100"
export const API = process.env.E2E_API ?? "http://127.0.0.1:8010"
export const USER = "ana@e2e.test"
export const ADMIN = "admin@e2e.test"
export const SHOTS = path.join(import.meta.dirname, "shots")

// Chromium: CHROME_PATH, o el que ya bajó Playwright, o Chrome instalado.
function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH
    ?? (process.platform === "win32" ? path.join(process.env.LOCALAPPDATA ?? "", "ms-playwright")
      : process.platform === "darwin" ? path.join(process.env.HOME ?? "", "Library", "Caches", "ms-playwright")
      : path.join(process.env.HOME ?? "", ".cache", "ms-playwright"))
  const exe = { win32: ["chrome-win64", "chrome.exe"], darwin: ["chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"], linux: ["chrome-linux", "chrome"] }[process.platform]
  const dirs = fs.existsSync(base) ? fs.readdirSync(base).filter(d => /^chromium-\d+$/.test(d)).sort().reverse() : []
  for (const d of dirs) {
    const p = path.join(base, d, ...exe)
    if (fs.existsSync(p)) return p
  }
  return undefined
}

export async function launch() {
  const executablePath = chromePath()
  return chromium.launch(executablePath ? { executablePath } : { channel: "chrome" })
}

// El secreto de NextAuth: el del entorno o el de .env.local (sin mostrarlo).
function nextAuthSecret() {
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET
  const env = fs.readFileSync(path.join(import.meta.dirname, "..", ".env.local"), "utf-8")
  return env.match(/^NEXTAUTH_SECRET=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "")
}

// Sesión iniciada sin pasar por Google: una cookie de NextAuth firmada con el
// mismo secreto, con el token "e2e:<email>" que acepta e2e/backend_e2e.py.
export async function loggedIn(context, email) {
  const now = Math.floor(Date.now() / 1000)
  const token = await encode({
    secret: nextAuthSecret(),
    token: {
      name: email.split("@")[0], email, sub: email,
      id_token: `e2e:${email}`, access_token: "e2e", refresh_token: "e2e",
      expires_at: now + 365 * 24 * 3600, termsAcceptedAt: new Date().toISOString(), lastChecked: Date.now(),
    },
  })
  await context.addCookies([{ name: "next-auth.session-token", value: token, url: FRONT }])
}

// Cloudinary simulado: las subidas devuelven el public_id pedido (como lo
// haría Cloudinary) y las imágenes, un píxel. No se sube nada de verdad.
const PIXEL = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64")
export async function fakeCloudinary(context) {
  const uploads = []
  await context.route("https://api.cloudinary.com/**", route => {
    const body = route.request().postData() ?? ""
    const publicId = body.match(/name="public_id"\r\n\r\n([^\r\n]+)/)?.[1] ?? "0/0000000000000000"
    const full = `rumbo/spots/${publicId}`
    uploads.push(full)
    route.fulfill({ json: { public_id: full, secure_url: `https://res.cloudinary.com/e2e/image/upload/v1/${full}.png` } })
  })
  await context.route("https://res.cloudinary.com/**", route => route.fulfill({ body: PIXEL, contentType: "image/png" }))
  return uploads
}

// Los mosaicos del mapa (OpenStreetMap), un píxel: si el servicio tardaba,
// un mosaico colgado no dejaba llegar a "networkidle" y la prueba se cortaba.
export async function offlineMaps(context) {
  await context.route(/tile\.openstreetmap\.org/, route => route.fulfill({ body: PIXEL, contentType: "image/png" }))
}

// Accesibilidad con axe: lo grave (lo que impide usar la página con lector
// de pantalla o teclado) y que la página tenga su contenido principal y su
// título. Devuelve "regla (cuántos)" por cada problema; vacío = bien.
const AXE = path.join(import.meta.dirname, "..", "node_modules", "axe-core", "axe.min.js")
export async function a11yProblems(page) {
  await page.addScriptTag({ path: AXE })
  return page.evaluate(async () => {
    const { violations } = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] })
    return violations
      .filter(v => v.impact === "critical" || v.impact === "serious" || ["landmark-one-main", "page-has-heading-one"].includes(v.id))
      .map(v => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target.join(" ")}`)
  })
}

// Lo que la política de seguridad (CSP, lib/securityHeaders.ts) bloquee en
// cualquier página del contexto: si bloquea algo que el sitio usa, se nota acá.
export function cspViolations(context) {
  const found = []
  context.on("console", msg => {
    if (/Content Security Policy|Refused to (load|connect|execute|frame)/i.test(msg.text())) found.push(msg.text().slice(0, 200))
  })
  return found
}

// Una imagen chica para los <input type=file>.
export const PHOTO = { name: "foto.png", mimeType: "image/png", buffer: PIXEL }

// Pedidos al backend como un usuario (para verificar lo que quedó guardado).
export async function apiGet(pathname, email = ADMIN) {
  const res = await fetch(`${API}${pathname}`, { headers: { Authorization: `Bearer e2e:${email}` } })
  if (!res.ok) throw new Error(`${pathname}: ${res.status}`)
  return res.json()
}

export async function apiPost(pathname, email = ADMIN, body = undefined) {
  const res = await fetch(`${API}${pathname}`, {
    method: "POST",
    headers: { Authorization: `Bearer e2e:${email}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${pathname}: ${res.status}`)
  return res.json()
}

export function report() {
  const lines = []
  return {
    ok: (name, cond, detail = "") => { lines.push(`${cond ? "OK   " : "FALLA"} ${name}${detail ? ` — ${detail}` : ""}`); return cond },
    lines,
    failed: () => lines.filter(l => l.startsWith("FALLA")).length,
  }
}

export async function shot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true })
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false })
}
