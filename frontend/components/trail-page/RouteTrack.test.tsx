import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"

// Sesión y API simuladas con valores comunes, no vi.fn.
let session: { id_token: string } | null = { id_token: "t" }
let posted: { url: string; body: { points: unknown[] }; token?: string }[] = []
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: session }) }))
vi.mock("next/dynamic", () => ({ default: () => ({ points }: { points: unknown[] }) => <div data-testid="track-map">{points.length} puntos</div> }))
vi.mock("@/components/layout/AuthModal", () => ({ default: () => <div role="dialog">Ingresá</div> }))
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  api: { post: (url: string, body: { points: unknown[] }, opts: { token?: string }) => { posted.push({ url, body, token: opts?.token }); return Promise.resolve({ data: {} }) } },
}))

const { default: RouteTrack } = await import("./RouteTrack")

const props = { routeId: 4, routeName: "Cumbre", routeSlug: "cumbre", track: null, pending: false }
const gpxFile = (body: string) => new File([`<gpx><trk><trkseg>${body}</trkseg></trk></gpx>`], "r.gpx", { type: "application/gpx+xml" })

afterEach(() => { session = { id_token: "t" }; posted = [] })

describe("Recorrido de la ruta", () => {
  it("publicado: el mapa, los datos y Descargar GPX", () => {
    const created: Blob[] = []
    URL.createObjectURL = (b: Blob) => { created.push(b); return "blob:x" }
    URL.revokeObjectURL = () => {}
    const track = { points: [[-34.3, -55.2, 100], [-34.31, -55.2, 150]] as [number, number, number | null][], distance_km: 7.45, elevation_gain: 520, elevation_loss: 510 }
    render(<RouteTrack {...props} track={track} />)
    expect(screen.getByTestId("track-map").textContent).toBe("2 puntos")
    expect(screen.getByText("7,5 km · ↑ 520 m · ↓ 510 m")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "⬇ Descargar GPX" }))
    expect(created).toHaveLength(1)
    expect(created[0].type).toBe("application/gpx+xml")
  })

  it("sin recorrido invita a subirlo; sin sesión pide ingresar", () => {
    session = null
    render(<RouteTrack {...props} />)
    expect(screen.getByText(/Todavía no está el recorrido en el mapa/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "＋ Subir el recorrido (GPX)" }))
    expect(screen.getByRole("dialog").textContent).toBe("Ingresá")
  })

  it("lee el GPX y manda los puntos a revisión", async () => {
    render(<RouteTrack {...props} />)
    fireEvent.click(screen.getByRole("button", { name: "＋ Subir el recorrido (GPX)" }))
    const file = gpxFile(`<trkpt lat="-34.3" lon="-55.2"><ele>100</ele></trkpt><trkpt lat="-34.31" lon="-55.2"/>`)
    await act(async () => { fireEvent.change(screen.getByLabelText("Elegir archivo GPX"), { target: { files: [file] } }) })
    expect(screen.getByText("✓ Recorrido de 2 puntos listo para subir.")).toBeTruthy()
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Subir recorrido" })) })
    expect(posted).toEqual([{ url: "/routes/4/track", token: "t", body: { points: [[-34.3, -55.2, 100], [-34.31, -55.2, null]] } }])
    expect(screen.getByRole("status").textContent).toContain("¡Gracias! El recorrido queda en revisión")
  })

  it("un archivo sin recorrido avisa y no manda nada", async () => {
    render(<RouteTrack {...props} />)
    fireEvent.click(screen.getByRole("button", { name: "＋ Subir el recorrido (GPX)" }))
    const notGpx = new File(["hola"], "foto.gpx")
    await act(async () => { fireEvent.change(screen.getByLabelText("Elegir archivo GPX"), { target: { files: [notGpx] } }) })
    expect(screen.getByText("No encontramos un recorrido en ese archivo. Tiene que ser un GPX.")).toBeTruthy()
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Subir recorrido" })) })
    expect(posted).toEqual([])
  })

  it("con uno en revisión no ofrece subir otro", () => {
    render(<RouteTrack {...props} pending />)
    expect(screen.queryByRole("button", { name: /Subir el recorrido/ })).toBeNull()
    expect(screen.getByRole("status").textContent).toContain("Hay un recorrido en revisión")
  })

  it("un GPX largo se simplifica antes de mandarlo (hasta 1.500 puntos)", async () => {
    render(<RouteTrack {...props} />)
    fireEvent.click(screen.getByRole("button", { name: "＋ Subir el recorrido (GPX)" }))
    const body = Array.from({ length: 1600 }, (_, i) => `<trkpt lat="${-34 - i / 100000}" lon="-55.2"/>`).join("")
    await act(async () => { fireEvent.change(screen.getByLabelText("Elegir archivo GPX"), { target: { files: [gpxFile(body)] } }) })
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Subir recorrido" })) })
    expect(posted[0].body.points).toHaveLength(1500)
  })
})
