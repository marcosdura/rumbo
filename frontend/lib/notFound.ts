import { ApiError } from "@/lib/api"

// "No existe" (404, o 422 de un id mal formado) se distingue de "falló la
// API" (500, timeout, red). Antes las páginas de detalle mandaban todo a
// notFound(): con el backend reiniciando, un lugar que existe decía que no
// existía y Google recibía un 404 de verdad. Ahora el resto de los errores
// sigue de largo hasta app/error.tsx (y responde 500: Google vuelve a probar).
export function isNotFound(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 404 || e.status === 422)
}

export function nullIfNotFound<T>(p: Promise<T>): Promise<T | null> {
  return p.catch((e: unknown) => {
    if (isNotFound(e)) return null
    throw e
  })
}
