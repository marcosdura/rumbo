// Lo que atiende la ventana de `npm run local` en vez de internet
// (local/run.mjs): las fotos de Cloudinary y el login de Google.
import fs from "node:fs"
import path from "node:path"

// "https://res.cloudinary.com/<nube>/image/upload/c_fill,w_640/f_auto/v1/rumbo/spots/12/abc.png?_a=x"
// → "rumbo/spots/12/abc". Todas las fotos de Rumbo viven bajo "rumbo/".
export function publicIdFromUrl(url) {
  const { pathname } = new URL(url)
  const at = pathname.indexOf("/rumbo/")
  if (at < 0) return null
  return decodeURIComponent(pathname.slice(at + 1)).replace(/\.[a-z0-9]+$/i, "")
}

// Nombre del archivo en la carpeta de fotos: solo letras, números, - y _
// (un id raro no puede escribir fuera de la carpeta).
export function fileNameFor(publicId) {
  if (!/^[\w-]+(\/[\w-]+)*$/.test(publicId)) return null
  return publicId.replaceAll("/", "__")
}

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }
const TYPE = Object.fromEntries(Object.entries(EXT).map(([type, ext]) => [ext, type]))

// La subida que arma lib/uploadImage.ts (multipart): el archivo y su id.
export function parseUpload(body, contentType) {
  const boundary = contentType?.match(/boundary=(?:"([^"]+)"|([^;]+))/)
  if (!boundary) return null
  const sep = Buffer.from(`--${boundary[1] ?? boundary[2]}`)
  const fields = {}
  let file = null
  let start = body.indexOf(sep)
  while (start >= 0) {
    const next = body.indexOf(sep, start + sep.length)
    if (next < 0) break
    const part = body.subarray(start + sep.length + 2, next - 2) // sin \r\n de cada lado
    const headEnd = part.indexOf("\r\n\r\n")
    const head = part.subarray(0, headEnd).toString()
    const data = part.subarray(headEnd + 4)
    const name = head.match(/name="([^"]+)"/)?.[1]
    if (name === "file") file = { data, type: head.match(/Content-Type:\s*([^\r\n]+)/i)?.[1]?.trim() ?? "" }
    else if (name) fields[name] = data.toString()
    start = next
  }
  if (!file || !fields.public_id) return null
  const publicId = fields.folder ? `${fields.folder}/${fields.public_id}` : fields.public_id
  return { publicId, file }
}

export function saveUpload(dir, upload) {
  const name = fileNameFor(upload.publicId)
  const ext = EXT[upload.file.type]
  if (!name || !ext) return false
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${name}.${ext}`), upload.file.data)
  return true
}

export function findPhoto(dir, publicId) {
  const name = fileNameFor(publicId)
  if (!name) return null
  for (const ext of Object.keys(TYPE)) {
    const file = path.join(dir, `${name}.${ext}`)
    if (fs.existsSync(file)) return { body: fs.readFileSync(file), contentType: TYPE[ext] }
  }
  return null
}

const escapeXml = s => s.replace(/[<>&"']/g, c => `&#${c.charCodeAt(0)};`)

// Las fotos de ejemplo (backend/demo_data.py) no existen: se dibujan, con
// un color que sale del nombre y el nombre del lugar.
export function placeholderSvg(publicId) {
  const last = publicId.split("/").pop() ?? ""
  const label = last.replace(/-\d+$/, "").replaceAll("-", " ")
  let hash = 0
  for (const c of publicId) hash = (hash * 31 + c.charCodeAt(0)) >>> 0
  const hue = hash % 360
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${hue} 45% 55%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 50% 30%)"/>
</linearGradient></defs>
<rect width="1200" height="800" fill="url(#g)"/>
<text x="600" y="390" text-anchor="middle" font-family="sans-serif" font-size="64" fill="white">${escapeXml(label)}</text>
<text x="600" y="460" text-anchor="middle" font-family="sans-serif" font-size="32" fill="white" opacity=".8">foto de ejemplo</text>
</svg>`
}

// Adónde volver después de entrar: solo a una página de este mismo sitio.
export function safeCallback(raw, front) {
  try {
    const url = new URL(raw ?? "/", front)
    return url.origin === new URL(front).origin ? url.href : front
  } catch {
    return front
  }
}

// En vez de Google: elegir con qué cuenta de ejemplo entrar.
export function loginPage(users, callbackUrl) {
  const links = users.map(({ email, label }) => {
    const href = `/__local/entrar?como=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`
    return `<a href="${escapeXml(href)}"><strong>${escapeXml(label)}</strong><span>${escapeXml(email)}</span></a>`
  }).join("")
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Entrar (local)</title><style>
body{font-family:system-ui,sans-serif;background:#f7f5f0;color:#1b1b19;display:grid;place-items:center;min-height:100vh;margin:0}
main{background:#fff;border:1px solid #e0ddd6;border-radius:16px;padding:28px;width:min(360px,calc(100vw - 32px))}
h1{font-size:20px;margin:0 0 6px}p{color:#6b6b63;font-size:14px;margin:0 0 18px}
a{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border:1px solid #e0ddd6;border-radius:12px;margin-bottom:10px;color:inherit;text-decoration:none}
a:hover{border-color:#2d6a4f}span{font-size:13px;color:#6b6b63}
</style></head><body><main><h1>Entrar en Rumbo local</h1>
<p>Sin Google: elegí una cuenta de ejemplo. Solo existe en tu compu.</p>${links}</main></body></html>`
}
