// Cómo terminó un envío de agregar-lugar:
// - "spot": se cargó un lugar nuevo (siempre pasa por revisión).
// - "pending": se sumó algo a un lugar existente y quedó en revisión
//   (lugar ya aprobado; backend/contributions.py).
// - "published": se sumó algo a un lugar existente y se publicó directo
//   (lugar propio todavía no aprobado, o admin).
export type SubmitResult = "spot" | "pending" | "published"

export function contributionResult(created: { is_approved?: boolean }[]): SubmitResult {
  return created.some(item => item.is_approved === false) ? "pending" : "published"
}

export const RESULT_COPY: Record<SubmitResult, { title: string; text: string; again: string }> = {
  spot: {
    title: "¡Gracias!",
    text: "Tu lugar fue enviado y será revisado pronto.",
    again: "Enviar otro lugar",
  },
  pending: {
    title: "¡Gracias por tu aporte!",
    text: "Queda en revisión: lo vas a ver publicado cuando el equipo de Rumbo lo apruebe. Podés seguir su estado en tu perfil.",
    again: "Sumar otra cosa",
  },
  published: {
    title: "¡Listo!",
    text: "Se agregó al lugar.",
    again: "Sumar otra cosa",
  },
}

export type MySpot = { id: number; name: string; activities?: string[] }

// Trekking, surf y kayak se suman solo a lugares propios (el backend lo
// exige): el selector ofrece los del usuario con esa actividad.
export function mySpotsFor(spots: MySpot[], activity: string): { id: number; name: string }[] {
  return spots
    .filter(sp => sp.activities?.includes(activity))
    .map(sp => ({ id: sp.id, name: sp.name }))
}
