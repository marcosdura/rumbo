import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import SectorExtraFields from "./SectorExtraFields"
import { defaultSector } from "../constants"

function Harness() {
  const [sector, setSector] = useState(defaultSector())
  return (
    <>
      <SectorExtraFields sector={sector} upd={(f, v) => setSector(p => ({ ...p, [f]: v }))} />
      <output>{JSON.stringify([sector.approach_minutes, sector.sun_exposure, sector.rock_type])}</output>
    </>
  )
}

describe("SectorExtraFields", () => {
  it("arranca en No sé y guarda lo elegido", () => {
    render(<Harness />)
    for (const name of ["Aproximación", "Sol o sombra", "Tipo de roca"]) {
      const select = screen.getByLabelText(name) as HTMLSelectElement
      expect(select.selectedOptions[0].textContent).toBe("No sé")
    }
    fireEvent.change(screen.getByLabelText("Aproximación"), { target: { value: "20" } })
    fireEvent.change(screen.getByLabelText("Sol o sombra"), { target: { value: "sombra" } })
    fireEvent.change(screen.getByLabelText("Tipo de roca"), { target: { value: "granito" } })
    expect(screen.getByRole("status").textContent).toBe('["20","sombra","granito"]')
  })
})
