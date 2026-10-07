// Información práctica de cualquier lugar: mascotas, reserva y señal de
// celular. null = "no sé". Antes mascotas y señal estaban repartidas entre
// trekking, glamping y un amenity del camping (backend migración 0013).

export type PracticalKey = "pets_allowed" | "reservation_required" | "cell_signal"

export const PRACTICAL_FIELDS: { key: PracticalKey; question: string; emoji: string; yes: string; no: string }[] = [
  { key: "pets_allowed", question: "¿Acepta mascotas?", emoji: "🐶", yes: "Acepta mascotas", no: "No acepta mascotas" },
  { key: "reservation_required", question: "¿Hace falta reservar?", emoji: "📅", yes: "Hay que reservar", no: "No hace falta reservar" },
  { key: "cell_signal", question: "¿Hay señal de celular?", emoji: "📶", yes: "Hay señal de celular", no: "Sin señal de celular" },
]

export type PracticalInfo = Partial<Record<PracticalKey, boolean | null>>

// Lo que se sabe, para mostrar ("Acepta mascotas", "Sin señal..."). Lo que no
// se sabe no aparece.
export function knownPractical(info: PracticalInfo): { key: PracticalKey; emoji: string; text: string; value: boolean }[] {
  return PRACTICAL_FIELDS
    .filter(f => info[f.key] != null)
    .map(f => ({ key: f.key, emoji: f.emoji, text: info[f.key] ? f.yes : f.no, value: !!info[f.key] }))
}
