import { afterEach, describe, expect, it } from "vitest"
import { savePendingAction, takePendingAction } from "./pendingAction"

afterEach(() => sessionStorage.clear())

describe("acción pendiente del login", () => {
  it("se devuelve una sola vez", () => {
    savePendingAction({ kind: "favorite", spotId: 7 })
    expect(takePendingAction("favorite")).toEqual({ kind: "favorite", spotId: 7 })
    expect(takePendingAction("favorite")).toBeNull()
  })

  it("cada tipo la toma quien la hace: la de reseña no se pierde al cargar favoritos", () => {
    savePendingAction({ kind: "review", spotId: 7 })
    expect(takePendingAction("favorite")).toBeNull()
    expect(takePendingAction("review")).toEqual({ kind: "review", spotId: 7 })
    expect(takePendingAction("review")).toBeNull()
  })

  it("si lo guardado no es válido, no hace nada y se borra", () => {
    sessionStorage.setItem("rumbo_pending_action", JSON.stringify({ kind: "borrar-todo", spotId: 7 }))
    expect(takePendingAction("favorite")).toBeNull()
    expect(sessionStorage.getItem("rumbo_pending_action")).toBeNull()
    sessionStorage.setItem("rumbo_pending_action", "{roto")
    expect(takePendingAction("review")).toBeNull()
    expect(sessionStorage.getItem("rumbo_pending_action")).toBeNull()
  })
})
