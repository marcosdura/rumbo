// Lo que la persona quiso hacer antes de que le pidiéramos iniciar sesión,
// para hacerlo apenas vuelve del login de Google (antes tocaba ❤️, se
// logueaba y tenía que volver a tocarlo). Vive en sessionStorage: sobrevive
// la ida y vuelta a Google en la misma pestaña, y no queda colgado.
// - favorite: se guarda el lugar (Providers.jsx).
// - review: se abre el formulario de reseña de ese lugar (ReviewsSection).
// - guide: se guarda esa guía del blog (Providers.jsx).
export type PendingAction =
  | { kind: "favorite"; spotId: number }
  | { kind: "review"; spotId: number }
  | { kind: "guide"; slug: string }
export type PendingKind = PendingAction["kind"]

const KEY = "rumbo_pending_action"
const KINDS: PendingKind[] = ["favorite", "review", "guide"]

const isValid = (a: PendingAction | null): a is PendingAction =>
  !!a && KINDS.includes(a.kind) && (a.kind === "guide"
    ? typeof a.slug === "string" && /^[a-z0-9-]{1,160}$/.test(a.slug)
    : Number.isInteger(a.spotId))

export function savePendingAction(action: PendingAction) {
  try { sessionStorage.setItem(KEY, JSON.stringify(action)) } catch {}
}

// La devuelve una sola vez (y la borra), si es de este tipo: cada una la
// toma quien la hace (la de reseña no la puede tirar el que guarda favoritos).
export function takePendingAction<K extends PendingKind>(kind: K): Extract<PendingAction, { kind: K }> | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    let action: PendingAction | null = null
    try { action = JSON.parse(raw) } catch {}
    if (!isValid(action)) { sessionStorage.removeItem(KEY); return null }
    if (action.kind !== kind) return null
    sessionStorage.removeItem(KEY)
    return action as Extract<PendingAction, { kind: K }>
  } catch {
    return null
  }
}

export function clearPendingAction() {
  try { sessionStorage.removeItem(KEY) } catch {}
}
