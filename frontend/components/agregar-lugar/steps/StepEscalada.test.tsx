import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import StepEscalada from "./StepEscalada"
import { defaultSector } from "../constants"
import type { SectorItem } from "../types"

function Harness({ onNext }: { onNext: () => void }) {
  const [sectors, setSectors] = useState<SectorItem[]>([{ ...defaultSector(), type: "boulder" }])
  return <StepEscalada sectors={sectors} setSectors={setSectors} error={null} onBack={() => {}} onNext={onNext} />
}

describe("StepEscalada", () => {
  it("un sector con datos y sin nombre no deja seguir (antes se perdía al enviar)", () => {
    let advanced = 0
    render(<Harness onNext={() => { advanced++ }} />)
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }))
    expect(screen.getByText("Completá el nombre de cada sector.")).toBeTruthy()
    expect(advanced).toBe(0)

    fireEvent.change(screen.getByLabelText("Nombre del sector 1"), { target: { value: "Placa Sur" } })
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }))
    expect(advanced).toBe(1)
  })
})
