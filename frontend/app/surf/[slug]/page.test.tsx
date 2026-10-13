import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

let school: Record<string, unknown> = {}
let summary = { average: null as number | null, total: 0 }
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404") } }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/layout/Footer", () => ({ default: () => null }))
vi.mock("@/components/ui/ReportButton", () => ({ default: () => null }))
vi.mock("@/components/spot-detail/ReviewsSection", () => ({ default: () => null }))
vi.mock("@/components/seo/JsonLd", () => ({ default: ({ data }: { data: unknown }) => <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} /> }))
vi.mock("@/components/operator-page/BackButton", () => ({ default: () => null }))
vi.mock("@/components/operator-page/OperatorPhotos", () => ({ default: () => null }))
let fail: number | null = null
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error { constructor(public status: number, m: string) { super(m) } },
  api: {
    get: async (url: string) => {
      const { ApiError } = await import("@/lib/api")
      if (fail && !url.endsWith("/summary")) throw new ApiError(fail, fail === 404 ? "No encontrado" : "caído")
      return Promise.resolve({ data: url.endsWith("/summary") ? summary : school })
    },
  },
}))

const { default: SurfSchoolPage, generateMetadata } = await import("./page")

const base = {
  id: 4, name: "Escuela Ola", duration: null, email: null, whatsapp: null, instagram: null,
  season_start: null, season_end: null, photo_1: null, photo_2: null, photo_3: null,
  spot_id: 3, spot_name: "Playa Brava", spot_department: "Rocha", class_type: null, equipment_include: null,
}

describe("Página de la escuela de surf", () => {
  it("muestra niveles e idiomas cuando se saben", async () => {
    school = { ...base, levels: ["principiante", "intermedio"], languages: ["espanol", "ingles"] }
    render(await SurfSchoolPage({ params: Promise.resolve({ slug: "escuela-ola-4" }) }))
    expect(screen.getByText("Principiante, Intermedio")).toBeTruthy()
    expect(screen.getByText("Español, Inglés")).toBeTruthy()
  })

  it("si no se saben, no muestra esas filas", async () => {
    school = { ...base, levels: null, languages: null }
    render(await SurfSchoolPage({ params: Promise.resolve({ slug: "escuela-ola-4" }) }))
    expect(screen.queryByText("Niveles")).toBeNull()
    expect(screen.queryByText("Idiomas")).toBeNull()
  })
})

const page = async () => render(await SurfSchoolPage({ params: Promise.resolve({ slug: "escuela-ola-4" }) }))

describe("Página de la escuela: encabezado y panel", () => {
  it("muestra el puntaje arriba, con link a las reseñas", async () => {
    school = { ...base }
    summary = { average: 4.6, total: 12 }
    const { container } = await page()
    expect(screen.getByText("4.6")).toBeTruthy()
    expect(screen.getByText("12 reseñas").closest("a")!.getAttribute("href")).toBe("#reviews")
    expect(container.querySelector("#reviews")).toBeTruthy()
    summary = { average: null, total: 0 }
  })

  it("sin reseñas invita a dejar la primera", async () => {
    school = { ...base }
    await page()
    expect(screen.getByText("¡Sé el primero en reseñar!")).toBeTruthy()
  })

  it("la temporada aparece una vez", async () => {
    school = { ...base, season_start: 12, season_end: 3 }
    await page()
    expect(screen.getAllByText("Diciembre – Marzo")).toHaveLength(1)
  })

  it("sin meses es Todo el año (la opción por defecto del formulario)", async () => {
    school = { ...base }
    await page()
    expect(screen.getAllByText("Todo el año")).toHaveLength(1)
  })

  it("fuera de temporada, lo avisa arriba", async () => {
    const next = (new Date().getMonth() + 1) % 12 + 1
    school = { ...base, season_start: next, season_end: next }
    await page()
    expect(screen.getByText(/⚠️ Fuera de temporada · abre en/)).toBeTruthy()
  })

  it("sin fotos, el panel ocupa el ancho (no queda una columna vacía)", async () => {
    school = { ...base }
    const { container } = await page()
    expect(container.querySelector(".op-grid")!.className).toContain("is-panel-only")
    school = { ...base, photo_1: "https://res.cloudinary.com/x/image/upload/v1/rumbo/3/abc.jpg" }
    const again = await page()
    expect(again.container.querySelector(".op-grid")!.className).not.toContain("is-panel-only")
  })
})

describe("Página de la escuela: contactar y llegar", () => {
  const beach = { spot_slug: "playa-brava", spot_lat: -34.96, spot_lng: -54.94 }

  it("la pill de la playa lleva a su página", async () => {
    school = { ...base, ...beach }
    await page()
    expect(screen.getByRole("link", { name: "📍 Playa Brava" }).getAttribute("href")).toBe("/spots/playa-brava")
  })

  it("WhatsApp con el mensaje escrito; el email abre el correo y se copia", async () => {
    school = { ...base, whatsapp: "099 123 456", email: "hola@ola.uy" }
    await page()
    const wa = new URL(screen.getByRole("link", { name: /099 123 456/ }).getAttribute("href")!)
    expect(wa.searchParams.get("text")).toBe("Hola, te escribo por Escuela Ola, que vi en Rumbo.")
    expect(screen.getByRole("link", { name: "hola@ola.uy" }).getAttribute("href")).toBe("mailto:hola@ola.uy")
    expect(screen.getByRole("button", { name: "Copiar" })).toBeTruthy()
  })

  it("Cómo llegar va a las coordenadas de la playa", async () => {
    school = { ...base, ...beach }
    await page()
    expect(screen.getByRole("link", { name: "📍 Cómo llegar a Playa Brava" }).getAttribute("href"))
      .toBe("https://www.google.com/maps/dir/?api=1&destination=-34.96,-54.94")
  })

  it("sin ubicación de la playa no ofrece Cómo llegar", async () => {
    school = { ...base }
    await page()
    expect(screen.queryByRole("link", { name: /Cómo llegar/ })).toBeNull()
  })
})

describe("Página de la escuela: compartir", () => {
  it("tiene Compartir, con el mismo modal que el lugar", async () => {
    school = { ...base }
    await page()
    fireEvent.click(screen.getByRole("button", { name: "🔗 Compartir" }))
    expect(screen.getByText("Copiar link")).toBeTruthy()
  })

  it("al compartir, la foto va recortada a 1200×630", async () => {
    school = { ...base, photo_1: "https://res.cloudinary.com/rumbo/image/upload/v1/rumbo/3/abc.jpg" }
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "escuela-ola-4" }) })
    const og = (meta.openGraph?.images as { url: string; width: number }[])[0]
    expect(og.url).toBe("https://res.cloudinary.com/rumbo/image/upload/c_fill,g_auto,w_1200,h_630,q_auto,f_jpg/v1/rumbo/3/abc.jpg")
    expect(og.width).toBe(1200)
  })
})

describe("Página de la escuela: descripción", () => {
  it("muestra la descripción con sus párrafos, aunque no haya fotos", async () => {
    school = { ...base, description: "Clases para toda la familia.\n\nTablas incluidas." }
    const { container } = await page()
    expect(screen.getByText("Sobre la escuela")).toBeTruthy()
    expect(screen.getByText(/Clases para toda la familia/).textContent).toBe("Clases para toda la familia.\n\nTablas incluidas.")
    expect(container.querySelector(".op-grid")!.className).not.toContain("is-panel-only")
  })

  it("la descripción es la de los metadatos", async () => {
    school = { ...base, description: "Clases para toda la familia." }
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "escuela-ola-4" }) })
    expect(meta.description).toBe("Clases para toda la familia.")
  })
})

describe("Si no existe o si falló la API", () => {
  const params = Promise.resolve({ slug: "escuela-ola-4" })
  it("si no existe, 404", async () => {
    fail = 404
    await expect(SurfSchoolPage({ params })).rejects.toThrow("404")
    fail = null
  })

  it("si la API falla no dice que no existe: el error sigue hasta la pantalla de error", async () => {
    fail = 503
    await expect(SurfSchoolPage({ params })).rejects.toThrow("caído")
    fail = null
  })
})

describe("SEO", () => {
  it("canónica con el nombre de hoy y migas de pan con la playa", async () => {
    school = { ...base, name: "Escuela Ola ", spot_slug: "playa", spot_name: "Playa Brava" }
    const { generateMetadata, default: Page } = await import("./page")
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "nombre-viejo-4" }) })
    expect(meta.title).toBe("Escuela Ola | Rumbo")
    expect(meta.alternates?.canonical).toBe("/surf/escuela-ola-4")
    const { container } = render(await Page({ params: Promise.resolve({ slug: "escuela-ola-4" }) }))
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent ?? "[]")
    const crumbs = ld.find((x: { "@type": string }) => x["@type"] === "BreadcrumbList")
    expect(crumbs.itemListElement.map((i: { name: string }) => i.name)).toEqual(["Inicio", "Playa Brava", "Escuela Ola"])
  })
})
