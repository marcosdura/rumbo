// Cabeceras de seguridad de todas las páginas (next.config.ts). Antes no
// había ninguna: sin CSP, un XSS podía mandar el token de la sesión a
// cualquier lado, y cualquier sitio podía meter Rumbo en un iframe invisible
// para que alguien hiciera clic sin darse cuenta (por ejemplo, en el admin).
//
// La CSP permite 'unsafe-inline' en scripts porque Next mete scripts en línea
// en cada página (sin nonce, para poder seguir generándolas de antemano).
// Lo que sí corta: de dónde se cargan scripts e imágenes y a dónde se puede
// mandar datos (connect-src), que es lo que usaría un robo de sesión.

const CLOUDINARY = ["https://res.cloudinary.com", "https://api.cloudinary.com"]
// Google Analytics 4: el script, a dónde manda las visitas y, con "señales de
// Google" activadas, también a google.com y doubleclick.
const ANALYTICS = [
  "https://www.googletagmanager.com", "https://*.google-analytics.com", "https://*.analytics.google.com",
  "https://www.google.com", "https://stats.g.doubleclick.net",
]
// La compresión de imágenes (lib/compressImage.ts) corre en un worker que
// baja la librería de acá: solo esa versión.
const IMAGE_COMPRESSION = "https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/"

function origin(url: string | undefined): string | null {
  try {
    return url ? new URL(url).origin : null
  } catch {
    return null
  }
}

export function contentSecurityPolicy(apiUrl: string | undefined, dev = false): string {
  const api = origin(apiUrl)
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // En desarrollo, Next usa eval para recargar en caliente.
    "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : []), "https://www.googletagmanager.com", IMAGE_COMPRESSION],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": [
      "'self'", "data:", "blob:", "https://res.cloudinary.com",
      // Mapas, el pin de Leaflet y la foto de perfil de Google.
      "https://*.tile.openstreetmap.org", "https://unpkg.com", "https://*.googleusercontent.com",
      ...ANALYTICS,
    ],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...(api ? [api] : []), ...CLOUDINARY, ...ANALYTICS, ...(dev ? ["ws:"] : [])],
    "worker-src": ["'self'", "blob:"],
    "frame-src": ["'self'"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
  }
  return Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`).join("; ")
}

export function securityHeaders(apiUrl: string | undefined, dev = false): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(apiUrl, dev) },
    // Lo mismo que frame-ancestors, para navegadores viejos.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Nada de cámara, micrófono, ubicación ni pagos: Rumbo no los usa.
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ]
}
