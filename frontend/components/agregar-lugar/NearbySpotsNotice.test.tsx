import { afterEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"

let nearby: unknown[] = []
let asked: unknown[] = []
vi.mock("@/lib/api", () => ({
  api: { get: (_url: string, opts: { params: unknown }) => { asked.push(opts.params); return Promise.resolve({ data: nearby }) } },
}))

const { default: NearbySpotsNotice, formatDistance } = await import("./NearbySpotsNotice")

afterEach(() => {
  nearby = []
  asked = []
  vi.useRealTimers()
})

async function settle() {
  await act(async () => { vi.advanceTimersByTime(500) })
  await act(() => Promise.resolve())
}

describe("NearbySpotsNotice", () => {
  it("si hay lugares cerca, pregunta si es alguno y linkea cada uno", async () => {
    vi.useFakeTimers()
    nearby = [{ id: 1, name: "Camping del Arroyo", slug: "camping-del-arroyo", category: "Camping", distance_m: 240 }]
    render(<NearbySpotsNotice lat="-34.5" lng="-55" />)
    await settle()
    expect(screen.getByText(/¿Es alguno de estos\?/)).toBeTruthy()
    expect(screen.getByRole("link", { name: "Camping del Arroyo" }).getAttribute("href")).toBe("/spots/camping-del-arroyo")
    expect(screen.getByText(/a 240 m/)).toBeTruthy()
  })

  it("sin lugares cerca no muestra nada", async () => {
    vi.useFakeTimers()
    const { container } = render(<NearbySpotsNotice lat="-34.5" lng="-55" />)
    await settle()
    expect(asked).toHaveLength(1)
    expect(container.innerHTML).toBe("")
  })

  it("sin ubicación no consulta", async () => {
    vi.useFakeTimers()
    render(<NearbySpotsNotice lat="" lng="" />)
    await settle()
    expect(asked).toEqual([])
  })

  it("al mover el pin no muestra los del punto anterior", async () => {
    vi.useFakeTimers()
    nearby = [{ id: 1, name: "Camping del Arroyo", slug: "x", category: null, distance_m: 100 }]
    const { rerender } = render(<NearbySpotsNotice lat="-34.5" lng="-55" />)
    await settle()
    nearby = []
    rerender(<NearbySpotsNotice lat="-30" lng="-56" />)
    expect(screen.queryByText("Camping del Arroyo")).toBeNull()
  })
})

describe("formatDistance", () => {
  it("metros redondeados o km", () => {
    expect(formatDistance(3)).toBe("a 10 m")
    expect(formatDistance(244)).toBe("a 240 m")
    expect(formatDistance(1500)).toBe("a 1.5 km")
  })
})
