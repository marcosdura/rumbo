// Lo que la persona quiso hacer antes de que le pidiéramos iniciar sesión,
// para hacerlo apenas vuelve del login de Google (antes tocaba ❤️, se
// logueaba y tenía que volver a tocarlo). Vive en sessionStorage: sobrevive
// la ida y vuelta a Google en la misma pestaña, y no queda colgado.
// - favorite: se guarda el lugar (Providers.jsx).
// - review: se abre el formulario de reseña de ese lugar (ReviewsSection).
export type PendingKind = "favorite" | "review"
export type PendingAction = { kind: PendingKind; spotId: number }

const KEY = "rumbo_pending_action"
const KINDS: PendingKind[] = ["favorite", "review"]

export function savePendingAction(action: PendingAction) {
  try { sessionStorage.setItem(KEY, JSON.stringify(action)) } catch {}
}

// La devuelve una sola vez (y la borra), si es de este tipo: cada una la
// toma quien la hace (la de reseña no la puede tirar el que guarda favoritos).
export function takePendingAction(kind: PendingKind): PendingAction | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    let action: PendingAction | null = null
    try { action = JSON.parse(raw) } catch {}
    const valid = !!action && KINDS.includes(action.kind) && Number.isInteger(action.spotId)
    if (!valid) { sessionStorage.removeItem(KEY); return null }
    if (action!.kind !== kind) return null
    sessionStorage.removeItem(KEY)
    return action
  } catch {
    return null
  }
}

export function clearPendingAction() {
  try { sessionStorage.removeItem(KEY) } catch {}
}
