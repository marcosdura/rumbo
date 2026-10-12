import { afterEach, describe, expect, it } from "vitest"
import { savePendingAction, takePendingAction } from "./pendingAction"

afterEach(() => sessionStorage.clear())

describe("acción pendiente del login", () => {
  it("se devuelve una sola vez", () => {
    savePendingAction({ kind: "favorite", spotId: 7 })
    expect(takePendingAction()).toEqual({ kind: "favorite", spotId: 7 })
    expect(takePendingAction()).toBeNull()
  })

  it("si lo guardado no es válido, no hace nada", () => {
    sessionStorage.setItem("rumbo_pending_action", JSON.stringify({ kind: "borrar-todo", spotId: 7 }))
    expect(takePendingAction()).toBeNull()
    sessionStorage.setItem("rumbo_pending_action", "{roto")
    expect(takePendingAction()).toBeNull()
  })
})
