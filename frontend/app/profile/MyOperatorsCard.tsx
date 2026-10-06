"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Pill from "@/components/ui/Pill"
import { api } from "@/lib/api"
import { OPERATOR_LABELS, type Operator } from "@/app/dashboard/operadores/[kind]/[id]/operator"
import { s } from "./styles"
import { ctaLink } from "./MySpotsCard"

interface Props {
  token: string | undefined
}

// "Tus escuelas": escuelas de surf y servicios de kayak de los que sos
// dueño (no de la playa: de la escuela). Como la mayoría de los usuarios no
// tiene ninguna, la tarjeta solo aparece si hay alguna — sumar una se ofrece
// en la página de cada playa y desde "Agregar lugar".
export default function MyOperatorsCard({ token }: Props) {
  const [items, setItems] = useState<Operator[]>([])

  useEffect(() => {
    if (!token) return
    api.get<Operator[]>("/operators/mine", { token })
      .then(({ data }) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [token])

  if (items.length === 0) return null

  return (
    <div className="fade-up fade-up-3" style={{ ...s.card, padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)" }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
          Tus escuelas
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map(op => (
          <div key={`${op.kind}-${op.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #ede9e1" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {op.name}
              </p>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 4px" }}>{OPERATOR_LABELS[op.kind]} en {op.spot.name}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Pill variant={op.is_approved ? "green" : "yellow"} size="sm">{op.is_approved ? "Publicada" : "En revisión"}</Pill>
                {op.change_request?.status === "pending" && <Pill variant="orange" size="sm">Cambio en revisión</Pill>}
              </div>
            </div>
            <Link href={`/dashboard/operadores/${op.kind}/${op.id}`} style={{ ...ctaLink, flexShrink: 0 }}>
              Administrar →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
