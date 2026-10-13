import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import StepResumen from "./StepResumen"
import {
  CATEGORIES, defaultGlampingDetail, defaultKayak, defaultMotorhomeDetail, defaultCampingDetail,
  defaultSector, defaultSurf, defaultTrekkingFeatures, emptyBasic,
} from "../constants"
import type { StepKey } from "../flow"

const cat = (name: string) => CATEGORIES.find(c => c.name === name)!

function renderSummary(over: Partial<Parameters<typeof StepResumen>[0]>) {
  const edited: StepKey[] = []
  render(
    <StepResumen
      selectedCat={cat("Glamping")}
      createsSpot={true}
      basic={{ ...emptyBasic(), name: "Domos del Este", department: "Rocha" }}
      trekkingFeatures={defaultTrekkingFeatures()}
      routes={[]}
      surf={defaultSurf()}
      kayak={defaultKayak()}
      submitting={false}
      uploadProgress={null}
      error={null}
      onSubmit={() => {}}
      onBack={() => {}}
      editTo={key => () => { edited.push(key) }}
      images={[new File(["x"], "a.jpg")]}
      previews={["blob:a"]}
      selectedAmenities={["Wifi"]}
      glampingUnits={[{ ...defaultGlampingDetail(), accommodation_type: "Domo" }]}
      motorhomeDetail={defaultMotorhomeDetail()}
      campingDetail={defaultCampingDetail()}
      additionalCategories={["Motorhome"]}
      experiences={[{ category_id: "", title: "Cabalgata", description: "", price: "900", schedule_type: "", schedule_custom: "" } as never]}
      {...over}
    />,
  )
  return edited
}

function editCard(title: string) {
  const card = screen.getByText(title).closest("div[style]")!.parentElement!
  fireEvent.click(within(card).getByRole("button", { name: "Editar" }))
}

describe("StepResumen", () => {
  it("cada Editar lleva a su paso (glamping)", () => {
    const edited = renderSummary({})
    editCard("Información general")
    editCard("Imágenes")
    editCard("Amenities del glamping")
    editCard("Tipos de alojamiento")
    editCard("Categorías adicionales")
    editCard("Experiencias")
    expect(edited).toEqual(["info", "imagenes", "amenities", "glamping_unidades", "adicionales", "experiencias"])
  })

  it("muestra las experiencias cargadas", () => {
    renderSummary({})
    expect(screen.getByText("Cabalgata")).toBeTruthy()
    expect(screen.getByText("$900")).toBeTruthy()
  })

  it("un aporte no muestra datos de un lugar nuevo", () => {
    renderSummary({
      selectedCat: cat("Escalada"), createsSpot: false, climbingMode: "new_sector",
      climbingSpotName: "Cerro Arequita", sectors: [{ ...defaultSector(), name: "Placa Sur" }],
      images: [], previews: [], selectedAmenities: [], glampingUnits: [], additionalCategories: [], experiences: [],
    })
    expect(screen.getByText("Revisá tu aporte")).toBeTruthy()
    expect(screen.queryByText("Información general")).toBeNull()
    expect(screen.queryByText("Precio y temporada")).toBeNull()
    expect(screen.getByText("Cerro Arequita")).toBeTruthy()
  })

  it("sin editTo para un paso, esa tarjeta no ofrece Editar", () => {
    renderSummary({ selectedCat: cat("Surf"), editTo: (key: StepKey) => (key === "info" ? undefined : () => {}) })
    const general = screen.getByText("Información general").closest("div[style]")!.parentElement!
    expect(within(general).queryByRole("button", { name: "Editar" })).toBeNull()
    const school = screen.getByText("Datos de la escuela de surf").closest("div[style]")!.parentElement!
    expect(within(school).getByRole("button", { name: "Editar" })).toBeTruthy()
  })
})

describe("Resumen de una escuela o un servicio (son lugares)", () => {
  const basic = { ...emptyBasic(), name: "Escuela Ola", department: "Maldonado", price: "1200", operates_at: " Playa El Emir " }

  it("dónde opera, el precio desde con su aclaración y lo propio de la escuela", () => {
    renderSummary({
      selectedCat: cat("Surf"), basic,
      surf: { ...defaultSurf(), class_type: "grupal", levels: ["principiante"], price_note: "por clase" },
      selectedAmenities: [], glampingUnits: [], additionalCategories: [], experiences: [],
    })
    expect(screen.getByText("Playa El Emir")).toBeTruthy()
    expect(screen.getByText("Desde $1.200 por clase")).toBeTruthy()
    expect(screen.getByText("Grupal")).toBeTruthy()
    expect(screen.getByText("Principiante")).toBeTruthy()
    expect(screen.queryByText("Tipo de acceso")).toBeNull()
  })

  it("kayak: gratis, y No sé en lo que no se contestó", () => {
    renderSummary({ selectedCat: cat("Kayak"), basic: { ...basic, price: "0" }, kayak: { ...defaultKayak(), rental_available: true }, selectedAmenities: [], glampingUnits: [], additionalCategories: [], experiences: [] })
    expect(screen.getByText("Gratis")).toBeTruthy()
    expect(screen.getByText("Alquiler disponible").parentElement!.textContent).toContain("Sí")
    expect(screen.getByText("Tipo de agua").parentElement!.textContent).toContain("No sé")
  })

  it("sin precio cargado dice Sin dato (para una escuela es opcional)", () => {
    renderSummary({ selectedCat: cat("Surf"), basic: { ...basic, price: "" }, selectedAmenities: [], glampingUnits: [], additionalCategories: [], experiences: [] })
    expect(screen.getByText("Sin dato")).toBeTruthy()
  })
})

describe("Resumen: fotos de rutas, sectores y vías", () => {
  it("dice cuántas tiene cada una", () => {
    const photo = new File(["x"], "a.jpg")
    renderSummary({
      selectedCat: cat("Escalada"), createsSpot: true,
      sectors: [{ ...defaultSector(), name: "Norte", photos: [photo, photo] }],
      sectorRoutes: [{ name: "Diedro", grade: "6a", type: "", length_m: "", bolts: "", description: "", sectorIndex: 0, photos: [photo] }],
    })
    expect(screen.getByText(/📷 2 fotos/)).toBeTruthy()
    expect(screen.getByText(/📷 1 foto$/)).toBeTruthy()
  })
})
