import { afterEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, render, screen } from "@testing-library/react"
import type { Forecast } from "@/lib/forecast"

let response: Forecast | Error = { days: [], source: "Open-Meteo.com" }
const asked: string[] = []
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => {
      asked.push(url)
      return response instanceof Error ? Promise.reject(response) : Promise.resolve({ data: response })
    },
  },
}))

const { default: ForecastCard } = await import("./ForecastCard")
const flush = () => act(() => new Promise(r => setTimeout(r, 0)))
const day = (date: string, extra: Partial<Forecast["days"][number]> = {}): Forecast["days"][number] => ({
  date, code: 0, max: 24, min: 12, rain: 10, wind: 18, wind_dir: 135, waves: null, ...extra,
})

afterEach(() => { cleanup(); asked.length = 0 })

describe("el pronóstico del lugar", () => {
  it("muestra cada día con su clima, temperaturas, lluvia y viento, y cita la fuente", async () => {
    response = { source: "Open-Meteo.com", days: [day("2026-11-02"), day("2026-11-03", { code: 61, max: 18, min: 11, rain: 80 })] }
    render(<ForecastCard spotId={7} />)
    await flush()
    expect(asked).toEqual(["/spots/7/forecast"])
    const days = screen.getAllByRole("listitem")
    expect(days).toHaveLength(2)
    expect(days[1].textContent).toContain("Lluvia")
    expect(days[1].textContent).toContain("18°")
    expect(days[1].textContent).toContain("💧 80%")
    expect(days[0].textContent).toContain("💨 18 km/h SE")
    expect(screen.getByRole("link", { name: "Open-Meteo.com" }).getAttribute("href")).toBe("https://open-meteo.com/")
  })

  it("las olas solo donde hay (surf), con coma decimal", async () => {
    response = { source: "Open-Meteo.com", days: [day("2026-11-02", { waves: { height: 1.2, period: 8, dir: 135 } }), day("2026-11-03")] }
    render(<ForecastCard spotId={7} />)
    await flush()
    const days = screen.getAllByRole("listitem")
    expect(days[0].textContent).toContain("🌊 1,2 m · 8 s SE")
    expect(days[1].textContent).toContain("🌊 —")
  })

  it("sin olas en ningún día (no es surf), no aparece la fila de olas", async () => {
    response = { source: "Open-Meteo.com", days: [day("2026-11-02")] }
    render(<ForecastCard spotId={7} />)
    await flush()
    expect(screen.getByRole("listitem").textContent).not.toContain("🌊")
  })

  it("si no hay pronóstico, la card no aparece", async () => {
    response = new Error("503")
    const { container } = render(<ForecastCard spotId={7} />)
    await flush()
    expect(container.innerHTML).toBe("")
  })
})
