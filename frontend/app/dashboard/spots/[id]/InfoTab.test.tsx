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
        lockSensitive={false} sensitiveReviewed={false} priceMode="own"
      />,
    )
    const pets = screen.getByText(/¿Acepta mascotas\?/).parentElement!
    fireEvent.click(pets.querySelectorAll("button")[1])  // "No"
    const signal = screen.getByText(/¿Hay señal de celular\?/).parentElement!
    fireEvent.click(signal.querySelectorAll("button")[0])  // "Sí"
    expect(changes).toEqual([["pets_allowed", false], ["cell_signal", true]])
  })
})

describe("InfoTab: precio solo donde se muestra", () => {
  const base = {
    editName: "", setEditName: noop, editDescription: "", setEditDescription: noop,
    editEmail: "", setEditEmail: noop, editWhatsapp: "", setEditWhatsapp: noop, editInstagram: "", setEditInstagram: noop,
    editPrice: "", setEditPrice: noop, editSeasonType: "all_year" as const, setEditSeasonType: noop,
    editSeasonStart: "", setEditSeasonStart: noop, editSeasonEnd: "", setEditSeasonEnd: noop,
    editIsPublic: null, setEditIsPublic: noop, editPublicTransport: null, setEditPublicTransport: noop,
    editPractical: { pets_allowed: null, reservation_required: null, cell_signal: null }, setEditPractical: noop,
    lockSensitive: false, sensitiveReviewed: false,
  }

  it("camping o motorhome: precio por noche", () => {
    render(<InfoTab {...base} priceMode="own" />)
    expect(screen.getByText("Precio por noche (UYU) — poné 0 si es gratis")).toBeTruthy()
  })

  it("glamping: el precio va en cada alojamiento", () => {
    render(<InfoTab {...base} priceMode="glamping" />)
    expect(screen.queryByText(/Precio por noche \(UYU\)/)).toBeNull()
    expect(screen.getByText(/El precio por noche va en cada alojamiento/)).toBeTruthy()
  })

  it("trekking, escalada, surf o kayak: no se pide (nunca se mostraba)", () => {
    render(<InfoTab {...base} priceMode="none" />)
    expect(screen.queryByText(/Precio/)).toBeNull()
  })
})
