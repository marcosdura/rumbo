import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

// El mapa (Leaflet) no corre en jsdom: un botón que elige un punto.
vi.mock("next/dynamic", () => ({
  default: () => ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) =>
    <button type="button" onClick={() => onLocationSelect(-34.5, -55.25)}>marcar en el mapa</button>,
}))

const { default: InfoTab } = await import("./InfoTab")

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
        location={[null, null]} newLocation={null} setNewLocation={noop}
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
    location: [-34, -55] as [number, number], newLocation: null, setNewLocation: noop,
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

describe("InfoTab: ubicación", () => {
  const base = {
    editName: "", setEditName: noop, editDescription: "", setEditDescription: noop,
    editEmail: "", setEditEmail: noop, editWhatsapp: "", setEditWhatsapp: noop, editInstagram: "", setEditInstagram: noop,
    editPrice: "", setEditPrice: noop, editSeasonType: "all_year" as const, setEditSeasonType: noop,
    editSeasonStart: "", setEditSeasonStart: noop, editSeasonEnd: "", setEditSeasonEnd: noop,
    editIsPublic: null, setEditIsPublic: noop, editPublicTransport: null, setEditPublicTransport: noop,
    editPractical: { pets_allowed: null, reservation_required: null, cell_signal: null }, setEditPractical: noop,
    lockSensitive: false, priceMode: "none" as const, location: [-34, -55] as [number, number],
  }

  it("el dueño marca la nueva en el mapa; publicada, avisa que pasa por revisión", () => {
    const picked: unknown[] = []
    render(<InfoTab {...base} sensitiveReviewed newLocation={null} setNewLocation={v => picked.push(v)} />)
    expect(screen.getByText(/El cambio pasa por revisión/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "marcar en el mapa" }))
    expect(picked).toEqual([[-34.5, -55.25]])
  })

  it("elegida, se puede deshacer", () => {
    const picked: unknown[] = []
    render(<InfoTab {...base} sensitiveReviewed={false} newLocation={[-34.5, -55.25]} setNewLocation={v => picked.push(v)} />)
    fireEvent.click(screen.getByRole("button", { name: "Deshacer" }))
    expect(picked).toEqual([null])
  })

  it("con un cambio en revisión no deja pedir otro", () => {
    render(<InfoTab {...base} sensitiveReviewed newLocation={null} setNewLocation={noop} pendingLocation={[-34.5, -55.25]} />)
    expect(screen.getByText("⏳ Hay un cambio de ubicación en revisión.")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "marcar en el mapa" })).toBeNull()
  })
})
