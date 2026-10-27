// Rumbo entero en tu compu, para mirar cambios antes de subirlos:
// `npm run local`.
//
// Levanta el backend con una base propia (local/backend_local.py) y el
// frontend en modo desarrollo (se actualiza solo al cambiar el código), y
// abre una ventana de Chrome en http://localhost:3200. Al cerrar la ventana
// (o Ctrl+C) se apaga todo.
//
// Nada sale de tu compu ni entra al repo:
// - La base y las fotos que subas quedan en .rumbo-local/, que está en el
//   .gitignore (si no lo estuviera, no arranca).
// - En esa ventana, las subidas a Cloudinary y las fotos se atienden con
//   archivos de .rumbo-local/fotos/; el login es con cuentas de ejemplo, sin
//   Google (local/intercept.mjs). Y por las dudas, el frontend corre con
//   claves de Cloudinary falsas: si algo se escapara, Cloudinary lo rechaza.
//
//   npm run local              con lo que ya cargaste (o los datos de ejemplo)
//   npm run local -- --de-cero borra .rumbo-local/ y vuelve a los de ejemplo
import { spawn, spawnSync } from "node:child_process"
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { launch, loggedIn } from "../e2e/lib.mjs"
import { findPhoto, loginPage, parseUpload, placeholderSvg, publicIdFromUrl, safeCallback, saveUpload } from "./intercept.mjs"

const require = createRequire(import.meta.url)
const ROOT = path.join(import.meta.dirname, "..")
const NEXT = require.resolve("next/dist/bin/next")
export const DATA = ".rumbo-local"
const DATA_DIR = path.join(ROOT, DATA)
const PHOTOS = path.join(DATA_DIR, "fotos")
export const FRONT = "http://localhost:3200"
export const API = "http://127.0.0.1:8020"
const ADMIN = "admin@rumbo.local"
const USERS = [
  { email: ADMIN, label: "Admin" },
  { email: "ana@rumbo.local", label: "Ana (tiene un lugar propio y otro pendiente)" },
  { email: "pedro@rumbo.local", label: "Pedro" },
]

const env = {
  ...process.env,
  NEXT_DIST_DIR: ".next-local",
  NEXT_PUBLIC_API_URL: API,
  NEXT_PUBLIC_SITE_URL: FRONT,
  NEXTAUTH_URL: FRONT,
  ADMIN_EMAIL: ADMIN,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "rumbo-local",
  CLOUDINARY_API_KEY: "local-sin-cloudinary",
  CLOUDINARY_API_SECRET: "local-sin-cloudinary",
  NEXT_PUBLIC_GA_MEASUREMENT_ID: "",
  LOCAL_ADMIN: ADMIN,
  LOCAL_USERS: USERS.slice(1).map(u => u.email).join(","),
  LOCAL_FRONTEND: FRONT,
}

// Lo que escribe el modo local tiene que estar en el .gitignore.
export function notIgnored(paths, cwd = ROOT) {
  return paths.filter(p => spawnSync("git", ["check-ignore", "-q", p], { cwd }).status !== 0)
}
export const WRITES = [`${DATA}/rumbo.db`, `${DATA}/fotos/rumbo__spots__1__abc.jpg`, ".next-local/server/x.js"]

const children = []
let stopping = false
function start(cmd, args, name) {
  const child = spawn(cmd, args, { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] })
  let log = ""
  child.stdout.on("data", d => { log += d })
  child.stderr.on("data", d => { log += d })
  child.on("exit", code => { if (code && !stopping) console.error(`\n${name} terminó con código ${code}:\n${log.slice(-2000)}`) })
  children.push(child)
}
export function stopAll() {
  stopping = true
  for (const c of children) {
    if (c.exitCode !== null) continue
    // En Windows hay que cerrar el árbol (py lanza python, next lanza node).
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(c.pid), "/T", "/F"], { stdio: "ignore" })
    else c.kill("SIGTERM")
  }
}

async function waitFor(url, what, seconds) {
  const end = Date.now() + seconds * 1000
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return
    } catch { /* todavía no levantó */ }
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error(`${what} no respondió en ${seconds}s (${url})`)
}

export async function intercept(context) {
  // Subir una foto: se guarda en .rumbo-local/fotos/ y se contesta como Cloudinary.
  await context.route("https://api.cloudinary.com/**", route => {
    const req = route.request()
    const upload = parseUpload(req.postDataBuffer() ?? Buffer.alloc(0), req.headers()["content-type"])
    if (!upload || !saveUpload(PHOTOS, upload)) return route.fulfill({ status: 400, json: { error: { message: "Formato no soportado en local" } } })
    route.fulfill({ json: { public_id: upload.publicId, secure_url: `https://res.cloudinary.com/rumbo-local/image/upload/${upload.publicId}` } })
  })
  // Mostrar una foto: la que subiste, o una dibujada para las de ejemplo.
  await context.route("https://res.cloudinary.com/**", route => {
    const publicId = publicIdFromUrl(route.request().url())
    if (!publicId) return route.fulfill({ status: 404 })
    const saved = findPhoto(PHOTOS, publicId)
    route.fulfill(saved ?? { body: placeholderSvg(publicId), contentType: "image/svg+xml" })
  })
  // "Iniciar sesión": en vez de ir a Google, la página para elegir cuenta.
  await context.route(`${FRONT}/api/auth/signin**`, route => {
    const req = route.request()
    const raw = req.method() === "POST"
      ? new URLSearchParams(req.postData() ?? "").get("callbackUrl")
      : new URL(req.url()).searchParams.get("callbackUrl")
    const to = `${FRONT}/__local/entrar?callbackUrl=${encodeURIComponent(safeCallback(raw, FRONT))}`
    if (req.method() === "POST") return route.fulfill({ json: { url: to } })
    route.fulfill({ status: 302, headers: { location: to } })
  })
  await context.route(`${FRONT}/__local/entrar**`, async route => {
    const params = new URL(route.request().url()).searchParams
    const back = safeCallback(params.get("callbackUrl"), FRONT)
    const user = USERS.find(u => u.email === params.get("como"))
    if (!user) return route.fulfill({ contentType: "text/html", body: loginPage(USERS, back) })
    await loggedIn(context, user.email, FRONT)
    route.fulfill({ status: 302, headers: { location: back } })
  })
}

export async function startServers({ fromScratch = false } = {}) {
  const tracked = notIgnored(WRITES)
  if (tracked.length) throw new Error(`Esto no está en el .gitignore y podría subirse al repo: ${tracked.join(", ")}`)
  if (fromScratch) fs.rmSync(DATA_DIR, { recursive: true, force: true })
  fs.mkdirSync(DATA_DIR, { recursive: true })
  for (const url of [API, FRONT]) {
    const busy = await fetch(url).then(() => true, () => false)
    if (busy) throw new Error(`Ya hay algo escuchando en ${url}: cerralo antes.`)
  }

  const python = process.env.PYTHON ?? (process.platform === "win32" ? "py" : "python3")
  start(python, [path.join("local", "backend_local.py"), new URL(API).port, path.join(DATA_DIR, "rumbo.db")], "backend")
  await waitFor(`${API}/spots/ids`, "El backend", 90)
  console.log("Backend listo. Levantando el frontend (la primera página tarda un poco)...")
  start(process.execPath, [NEXT, "dev", "-p", new URL(FRONT).port], "frontend")
  await waitFor(FRONT, "El frontend", 240)
}

async function main() {
  await startServers({ fromScratch: process.argv.includes("--de-cero") })
  const browser = await launch({ headless: false })
  const context = await browser.newContext({ viewport: null })
  await intercept(context)
  const page = await context.newPage()
  await page.goto(FRONT)
  console.log(`\nListo: ${FRONT} en la ventana que se abrió. "Iniciar sesión" deja elegir cuenta.`)
  console.log(`Base y fotos en ${DATA}/ (fuera del repo). Cerrá la ventana o Ctrl+C para apagar todo.`)
  await new Promise(resolve => {
    browser.on("disconnected", resolve)
    process.on("SIGINT", resolve)
  })
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  main()
    .then(() => { stopAll(); process.exit(0) })
    .catch(e => { console.error(e.message); stopAll(); process.exit(1) })
}
