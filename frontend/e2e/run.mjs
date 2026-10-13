// Pruebas en el navegador, de punta a punta: `npm run e2e`.
//
// Levanta todo en local y aislado: el backend con una base SQLite descartable
// y login de prueba (e2e/backend_e2e.py), y el frontend compilado en
// .next-e2e. Después recorre el sitio con Chromium (e2e/publico.mjs y
// e2e/cuenta.mjs) y cierra todo. No toca producción ni sube fotos.
//
//   npm run e2e                 todo (compila primero)
//   npm run e2e -- --sin-build  sin recompilar (si no cambió el frontend)
//   npm run e2e -- cuenta       solo una parte (publico | cuenta)
//   npm run e2e -- --servidores solo levanta el backend y el frontend y los
//                               deja corriendo (para mirar o depurar a mano)
//
// Las capturas quedan en e2e/shots/. Correrlo antes de cada push.
import { spawn, spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import path from "node:path"
import { ADMIN, API, FRONT, USER, launch, report } from "./lib.mjs"

const require = createRequire(import.meta.url)
const ROOT = path.join(import.meta.dirname, "..")
const NEXT = require.resolve("next/dist/bin/next")
const args = process.argv.slice(2)
const suites = args.filter(a => !a.startsWith("--"))
const wanted = suites.length ? suites : ["publico", "cuenta"]

const env = {
  ...process.env,
  NEXT_DIST_DIR: ".next-e2e",
  NEXT_PUBLIC_API_URL: API,
  NEXTAUTH_URL: FRONT,
  ADMIN_EMAIL: ADMIN,
  E2E_ADMIN: ADMIN,
  E2E_USER: USER,
  E2E_FRONTEND: FRONT,
}
const children = []

function start(cmd, cmdArgs, name) {
  const child = spawn(cmd, cmdArgs, { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] })
  let log = ""
  child.stdout.on("data", d => { log += d })
  child.stderr.on("data", d => { log += d })
  child.on("exit", code => { if (code && !stopping) console.error(`\n${name} terminó con código ${code}:\n${log.slice(-2000)}`) })
  children.push(child)
  return child
}

let stopping = false
function stopAll() {
  stopping = true
  for (const c of children) {
    if (c.exitCode !== null) continue
    // En Windows hay que cerrar el árbol (py lanza python, next lanza node).
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(c.pid), "/T", "/F"], { stdio: "ignore" })
    else c.kill("SIGTERM")
  }
}

async function waitFor(url, what, seconds = 90) {
  const end = Date.now() + seconds * 1000
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return
    } catch { /* todavía no levantó */ }
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error(`${what} no respondió en ${seconds}s (${url})`)
}

async function main() {
  // El backend primero: el build arma la home con sus datos (si no, la
  // home de prueba queda en "No pudimos cargar los lugares").
  const python = process.env.PYTHON ?? (process.platform === "win32" ? "py" : "python3")
  start(python, [path.join("e2e", "backend_e2e.py"), new URL(API).port], "backend")
  await waitFor(`${API}/spots/ids`, "El backend")
  if (!args.includes("--sin-build")) {
    console.log("Compilando el frontend (.next-e2e)...")
    const build = spawnSync(process.execPath, [NEXT, "build"], { cwd: ROOT, env, stdio: "inherit" })
    if (build.status !== 0) throw new Error("Falló el build")
  }
  start(process.execPath, [NEXT, "start", "-p", new URL(FRONT).port], "frontend")
  await waitFor(FRONT, "El frontend")
  if (args.includes("--servidores")) {
    console.log(`Listo: frontend en ${FRONT}, backend en ${API}. Ctrl+C para cerrar.`)
    process.on("SIGINT", () => { stopAll(); process.exit(0) })
    await new Promise(() => {})
  }

  const browser = await launch()
  const r = report()
  try {
    for (const name of wanted) {
      console.log(`\n▶ ${name}`)
      const suite = await import(`./${name}.mjs`)
      const before = r.lines.length
      try {
        await suite.run(browser, r)
      } catch (e) {
        r.ok(`${name}: se cortó`, false, e.message.split("\n")[0])
      }
      console.log(r.lines.slice(before).join("\n"))
    }
  } finally {
    await browser.close()
  }
  const failed = r.failed()
  console.log(`\n${r.lines.length - failed} OK, ${failed} con falla. Capturas en e2e/shots/`)
  return failed
}

main()
  .then(failed => { stopAll(); process.exit(failed ? 1 : 0) })
  .catch(e => { console.error(e.message); stopAll(); process.exit(1) })
