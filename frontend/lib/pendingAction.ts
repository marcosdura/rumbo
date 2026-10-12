// Lo que la persona quiso hacer antes de que le pidiéramos iniciar sesión,
// para hacerlo apenas vuelve del login de Google (antes tocaba ❤️, se
// logueaba y tenía que volver a tocarlo). Vive en sessionStorage: sobrevive
// la ida y vuelta a Google en la misma pestaña, y no queda colgado.
export type PendingAction = { kind: "favorite"; spotId: number }

const KEY = "rumbo_pending_action"

export function savePendingAction(action: PendingAction) {
  try { sessionStorage.setItem(KEY, JSON.stringify(action)) } catch {}
}

// La devuelve una sola vez (y la borra).
export function takePendingAction(): PendingAction | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    if (!raw) return null
    const action = JSON.parse(raw)
    return action?.kind === "favorite" && Number.isInteger(action.spotId) ? action : null
  } catch {
    return null
  }
}

export function clearPendingAction() {
  try { sessionStorage.removeItem(KEY) } catch {}
}
