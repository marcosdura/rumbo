"use client"

// Los campos editables del panel del dueño (pestaña Información): viven acá
// y no en InfoTab para que lo escrito no se pierda al cambiar de pestaña.
// Antes eran 12 useState sueltos en la página.
import { useState } from "react"
import type { PracticalKey } from "@/lib/practicalInfo"
import type { Spot } from "./types"

export type SpotFields = {
  name: string; description: string; email: string; whatsapp: string; instagram: string; price: string
  seasonType: "all_year" | "seasonal"; seasonStart: string; seasonEnd: string
  isPublic: boolean | null; publicTransport: string | null; practical: Record<PracticalKey, boolean | null>
}

const EMPTY: SpotFields = {
  name: "", description: "", email: "", whatsapp: "", instagram: "", price: "",
  seasonType: "all_year", seasonStart: "", seasonEnd: "", isPublic: null, publicTransport: null,
  practical: { pets_allowed: null, reservation_required: null, cell_signal: null },
}

export function fieldsFrom(s: Spot): SpotFields {
  return {
    name: s.name ?? "",
    description: s.description ?? "",
    email: s.email ?? "",
    whatsapp: s.whatsapp ?? "",
    instagram: s.instagram ?? "",
    price: s.price != null ? String(s.price) : "",
    seasonType: s.season_start ? "seasonal" : "all_year",
    seasonStart: s.season_start ? String(s.season_start) : "",
    seasonEnd: s.season_end ? String(s.season_end) : "",
    isPublic: s.is_public ?? null,
    publicTransport: s.public_transport ?? null,
    practical: {
      pets_allowed: s.pets_allowed ?? null,
      reservation_required: s.reservation_required ?? null,
      cell_signal: s.cell_signal ?? null,
    },
  }
}

// Lo que se manda a PATCH /admin/spots/{id}. También sirve para saber si hay
// cambios sin guardar (comparando con lo que se cargó).
export function payloadFrom(f: SpotFields) {
  return {
    name: f.name,
    description: f.description,
    email: f.email || null,
    whatsapp: f.whatsapp || null,
    instagram: f.instagram || null,
    price: f.price !== "" ? parseFloat(f.price) : null,
    season_start: f.seasonType === "seasonal" && f.seasonStart ? parseInt(f.seasonStart) : null,
    season_end: f.seasonType === "seasonal" && f.seasonEnd ? parseInt(f.seasonEnd) : null,
    is_public: f.isPublic,
    public_transport: f.publicTransport,
    ...f.practical,
  }
}

export function useSpotForm() {
  const [fields, setFields] = useState<SpotFields>(EMPTY)
  // Ubicación nueva elegida en el mapa (null = no se toca).
  const [newLocation, setNewLocation] = useState<[number, number] | null>(null)
  // Lo que se cargó, para saber si hay cambios sin guardar.
  const [baseline, setBaseline] = useState<string | null>(null)

  const set = <K extends keyof SpotFields>(key: K) => (value: SpotFields[K]) => setFields(f => ({ ...f, [key]: value }))

  function populate(s: Spot) {
    const loaded = fieldsFrom(s)
    setFields(loaded)
    setBaseline(JSON.stringify(payloadFrom(loaded)))
  }

  const formPayload = () => payloadFrom(fields)
  const buildPayload = () => ({ ...formPayload(), ...(newLocation ? { lat: newLocation[0], lng: newLocation[1] } : {}) })
  const changed = newLocation !== null || (baseline !== null && JSON.stringify(formPayload()) !== baseline)

  // Las props de InfoTab, con los nombres que ya usa.
  const infoProps = {
    editName: fields.name, setEditName: set("name"),
    editDescription: fields.description, setEditDescription: set("description"),
    editEmail: fields.email, setEditEmail: set("email"),
    editWhatsapp: fields.whatsapp, setEditWhatsapp: set("whatsapp"),
    editInstagram: fields.instagram, setEditInstagram: set("instagram"),
    editPrice: fields.price, setEditPrice: set("price"),
    editSeasonType: fields.seasonType, setEditSeasonType: set("seasonType"),
    editSeasonStart: fields.seasonStart, setEditSeasonStart: set("seasonStart"),
    editSeasonEnd: fields.seasonEnd, setEditSeasonEnd: set("seasonEnd"),
    editIsPublic: fields.isPublic, setEditIsPublic: set("isPublic"),
    editPublicTransport: fields.publicTransport,
    setEditPublicTransport: (updater: (prev: string | null) => string | null) => setFields(f => ({ ...f, publicTransport: updater(f.publicTransport) })),
    editPractical: fields.practical,
    setEditPractical: (key: PracticalKey, v: boolean | null) => setFields(f => ({ ...f, practical: { ...f.practical, [key]: v } })),
    newLocation, setNewLocation,
  }

  return { populate, buildPayload, changed, newLocation, setNewLocation, infoProps }
}
