import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import InfoTab from "./InfoTab"

const noop = () => {}

describe("InfoTab: información práctica", () => {
  it("muestra mascotas, reserva y señal, y cambiarlas avisa al panel", () => {
    const changes: [string, boolean | null][] = []
    render(
      <InfoTab
        editName="" setEditName={noop} editDescription="" setEditDescription={noop}
        editEmail="" setEditEmail={noop} editWhatsapp="" setEditWhatsapp={noop} editInstagram="" setEditInstagram={noop}
        editPrice="" setEditPrice={noop} editSeasonType="all_year" setEditSeasonType={noop}
        editSeasonStart="" setEditSeasonStart={noop} editSeasonEnd="" setEditSeasonEnd={noop}
        editIsPublic={null} setEditIsPublic={noop} editPublicTransport={null} setEditPublicTransport={noop}
        editPractical={{ pets_allowed: true, reservation_required: null, cell_signal: null }}
        setEditPractical={(k, v) => changes.push([k, v])}
        lockSensitive={false} sensitiveReviewed={false}
      />,
    )
    const pets = screen.getByText(/¿Acepta mascotas\?/).parentElement!
    fireEvent.click(pets.querySelectorAll("button")[1])  // "No"
    const signal = screen.getByText(/¿Hay señal de celular\?/).parentElement!
    fireEvent.click(signal.querySelectorAll("button")[0])  // "Sí"
    expect(changes).toEqual([["pets_allowed", false], ["cell_signal", true]])
  })
})
