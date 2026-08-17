// Cliente centralizado para hablar con el backend (NEXT_PUBLIC_API_URL).
// Reemplaza los fetch() sueltos repartidos por el frontend: arma la URL,
// agrega el header de auth si hay token, serializa el body/params y
// centraliza el manejo de errores (ApiError con el detail que manda el
// backend). No toca Cloudinary — eso sigue siendo lib/uploadImage.ts,
// otro destino, otro propósito.

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export interface ApiResult<T> {
  data: T
  totalCount: number | null
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

export interface ApiOptions {
  token?: string | null
  body?: unknown
  params?: Record<string, string | number | boolean | undefined | null>
  headers?: Record<string, string>
  // Passthrough para las directivas de cache de fetch en Server Components
  // (páginas server-side que ya usaban `cache: "no-store"` o
  // `next: { revalidate }` antes de esta migración).
  cache?: RequestCache
  next?: { revalidate?: number | false; tags?: string[] }
}

function buildUrl(path: string, params?: ApiOptions["params"]): string {
  const base = process.env.NEXT_PUBLIC_API_URL
  let url = `${base}${path}`
  if (params) {
    const qs = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        qs.append(key, String(value))
      }
    }
    const qsString = qs.toString()
    if (qsString) url += (path.includes("?") ? "&" : "?") + qsString
  }
  return url
}

async function request<T>(path: string, method: Method, opts: ApiOptions = {}): Promise<ApiResult<T>> {
  const { token, body, params, headers = {}, cache, next } = opts

  const res = await fetch(buildUrl(path, params), {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...(cache ? { cache } : {}),
    ...(next ? { next } : {}),
  } as RequestInit)

  if (!res.ok) {
    let detail = ""
    try {
      const errBody = await res.json()
      detail = errBody?.detail ?? ""
    } catch {
      // respuesta sin JSON (ej. 502 de un proxy) — se usa el fallback de abajo
    }
    throw new ApiError(res.status, detail || `Error ${res.status}`)
  }

  const totalCount = res.headers.get("X-Total-Count")
  if (res.status === 204) {
    return { data: undefined as T, totalCount: totalCount ? parseInt(totalCount, 10) : null }
  }
  const data = await res.json()
  return { data, totalCount: totalCount ? parseInt(totalCount, 10) : null }
}

export const api = {
  get: <T>(path: string, opts?: ApiOptions) => request<T>(path, "GET", opts),
  post: <T>(path: string, body?: unknown, opts?: ApiOptions) => request<T>(path, "POST", { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: ApiOptions) => request<T>(path, "PATCH", { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: ApiOptions) => request<T>(path, "PUT", { ...opts, body }),
  del: <T>(path: string, opts?: ApiOptions) => request<T>(path, "DELETE", opts),
}
