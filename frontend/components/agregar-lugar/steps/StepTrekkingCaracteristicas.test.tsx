import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import StepTrekkingCaracteristicas from "./StepTrekkingCaracteristicas"
import { defaultTrekkingFeatures, TREKKING_FEATURES } from "../constants"

const renderStep = (onNext: () => void = () => {}) => {
  let features = defaultTrekkingFeatures()
  const setFeatures = (u: unknown) => { features = typeof u === "function" ? (u as (f: typeof features) => typeof features)(features) : u as typeof features }
  render(<StepTrekkingCaracteristicas trekkingFeatures={features} setTrekkingFeatures={setFeatures as never} error={null} onBack={() => {}} onNext={onNext} />)
  return () => features
}

describe("Características del lugar de trekking", () => {
  it("'No sé' es una respuesta: sin marcas de obligatorio y se puede seguir sin responder nada", () => {
    let advanced = 0
    renderStep(() => { advanced++ })
    expect(screen.queryByText("*")).toBeNull()
    expect(screen.getByText("Indicá lo que sepas. Si no sabés algo, dejalo en «No sé».")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }))
    expect(advanced).toBe(1)
  })

  it("arranca todo en No sé y guarda Sí o No en lo que se responde", () => {
    const features = renderStep()
    expect(Object.values(features()).every(v => v === null)).toBe(true)
    fireEvent.click(screen.getAllByRole("button", { name: /^Sí$/ })[0])
    expect(features()[TREKKING_FEATURES[0].key]).toBe(true)
  })
})
