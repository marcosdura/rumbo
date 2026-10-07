// Cantidad de notificaciones sin leer, compartida por todas las campanitas.
// En la home hay dos montadas a la vez (la del hero y la del Navbar oculto):
// antes cada una consultaba por su cuenta cada minuto. Ahora hay una sola
// consulta mientras haya alguna campanita, y marcar como leída en una se ve
// en la otra.
import { api } from "@/lib/api"

// Cada cuánto se vuelve a mirar si hay avisos nuevos (solo con la pestaña
// visible). Es un número: una consulta liviana.
export const POLL_MS = 60_000

type Listener = () => void

let token: string | null = null
let unread = 0
let timer: ReturnType<typeof setInterval> | null = null
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach(l => l())
}

export function getUnread(): number {
  return unread
}

export function setUnread(next: number | ((prev: number) => number)) {
  unread = typeof next === "function" ? next(unread) : next
  emit()
}

function refresh() {
  const current = token
  if (!current) return
  api.get<{ unread: number }>("/notifications/unread-count", { token: current })
    .then(({ data }) => { if (token === current) setUnread(data.unread) })
    .catch(() => {})  // sin el número la app funciona igual
}

export function subscribe(nextToken: string, listener: Listener): () => void {
  listeners.add(listener)
  if (nextToken !== token) {
    token = nextToken
    refresh()
  }
  if (!timer) {
    timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh()
    }, POLL_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      if (timer) clearInterval(timer)
      timer = null
      token = null
      unread = 0
    }
  }
}
