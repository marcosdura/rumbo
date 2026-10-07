import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import StepResumen from "./StepResumen"
import {
  CATEGORIES, defaultGlampingDetail, defaultKayak, defaultMotorhomeDetail, defaultCampingDetail,
  defaultSurf, defaultTrekkingFeatures, emptyBasic,
} from "../constants"
import type { StepKey } from "../flow"

const cat = (name: string) => CATEGORIES.find(c => c.name === name)!

function renderSummary(over: Partial<Parameters<typeof StepResumen>[0]>) {
  const edited: StepKey[] = []
  render(
    <StepResumen
      selectedCat={cat("Glamping")}
      isService={false}
      createsSpot={true}
      basic={{ ...emptyBasic(), name: "Domos del Este", department: "Rocha" }}
      trekkingFeatures={defaultTrekkingFeatures()}
      routes={[]}
      surf={defaultSurf()}
      kayaks={[defaultKayak()]}
      availableSpots={[]}
      selectedSpotId={null}
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
      climbingSpotName: "Cerro Arequita", sectors: [{ name: "Placa Sur", type: "", max_altitude: "", restrictions: "" }],
      images: [], previews: [], selectedAmenities: [], glampingUnits: [], additionalCategories: [], experiences: [],
    })
    expect(screen.getByText("Revisá tu aporte")).toBeTruthy()
    expect(screen.queryByText("Información general")).toBeNull()
    expect(screen.queryByText("Precio y temporada")).toBeNull()
    expect(screen.getByText("Cerro Arequita")).toBeTruthy()
  })

  it("sin editTo para un paso, esa tarjeta no ofrece Editar", () => {
    render(
      <StepResumen
        selectedCat={cat("Surf")} isService={true} createsSpot={false}
        basic={emptyBasic()} trekkingFeatures={defaultTrekkingFeatures()} routes={[]}
        surf={{ ...defaultSurf(), name: "Escuela Ola" }} kayaks={[]}
        availableSpots={[{ id: 3, name: "Playa Brava" }]} selectedSpotId={3}
        submitting={false} uploadProgress={null} error={null} onSubmit={() => {}} onBack={() => {}}
        editTo={key => (key === "lugar" ? undefined : () => {})}
      />,
    )
    const general = screen.getByText("Información general").closest("div[style]")!.parentElement!
    expect(within(general).queryByRole("button", { name: "Editar" })).toBeNull()
    const school = screen.getByText("Datos de la escuela de surf").closest("div[style]")!.parentElement!
    expect(within(school).getByRole("button", { name: "Editar" })).toBeTruthy()
  })
})
