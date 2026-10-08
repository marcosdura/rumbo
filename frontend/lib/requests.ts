// "Mis pedidos" (GET /me/requests, backend/routers/me.py): cambios en tus
// lugares y escuelas, y pedidos para hacerte cargo de un lugar.
import { describeFields } from "@/app/dashboard/spots/[id]/changes"
import { describeOperatorFields } from "@/app/dashboard/operadores/[kind]/[id]/operator"

export type MyRequest = {
  kind: "spot_change" | "operator_change" | "claim"
  id: number
  status: "pending" | "approved" | "rejected"
  fields: string[]
  photo_count?: number
  target: { name: string; href: string | null }
  reject_reason: string | null
  created_at: string | null
  resolved_at: string | null
  // POST que cierra el aviso de un pedido resuelto.
  dismiss_url: string
}

// Qué pediste, en una línea.
export function requestTitle(r: MyRequest): string {
  if (r.kind === "claim") return `Hacerte cargo de ${r.target.name}`
  return `Cambio en ${r.target.name}`
}

export function requestDetail(r: MyRequest): string | null {
  if (r.kind === "claim") return null
  const fields = r.kind === "spot_change" ? describeFields(r.fields, r.photo_count ?? 0) : describeOperatorFields(r.fields)
  return fields ? `Pediste cambiar ${fields}` : null
}

// Adónde lleva "Ver": al panel para un cambio (o un reclamo aprobado), a la
// página del lugar para un reclamo.
export function requestLinkLabel(r: MyRequest): string {
  return r.target.href?.startsWith("/dashboard") ? "Administrar →" : "Ver →"
}
