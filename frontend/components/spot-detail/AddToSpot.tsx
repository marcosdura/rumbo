"use client"

// Accesos para sumar contenido desde la página pública de un lugar: los
// botones "＋ Sugerir un sector" / "＋ Agregar una ruta", la sección vacía
// que invita a sumar, la barra "Es tu lugar · Administrar" y el aviso de los
// aportes propios en revisión. Los botones llevan a agregar-lugar ya
// posicionado en el formulario (components/agregar-lugar/prefill.ts).
import Link from "next/link"
import type { ReactNode } from "react"
import { KIND_LABELS, type ContributionKind } from "@/lib/contributions"

const font = "var(--font-dm-sans), sans-serif"

// Mismo botón que "Ver spot →" del dashboard, en verde.
export function AddButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} style={{
      padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: font,
      border: "1px solid var(--border)", background: "#fff", color: "var(--primary)",
      textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {children}
    </Link>
  )
}

// Encabezado de sección (punto verde + título en mayúsculas, como en
// ClimbingSectorsCards y TrekkingRoutes), con una acción opcional a la derecha.
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
          {title}
        </p>
      </div>
      {action}
    </div>
  )
}

// Sección todavía vacía: antes no se mostraba, y no había dónde ofrecer sumar.
export function EmptySection({ title, text, href, label }: { title: string; text: string; href: string; label: string }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid var(--border)", borderRadius: 20,
      padding: "24px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", fontFamily: font,
    }}>
      <SectionHeader title={title} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <p style={{ fontSize: 14, color: "var(--muted-strong)", margin: 0, lineHeight: 1.5, flex: "1 1 260px" }}>{text}</p>
        <AddButton href={href}>{label}</AddButton>
      </div>
    </div>
  )
}

// Mismo formato que el banner de acceso público/privado de la página.
const banner = {
  borderRadius: 12, padding: "10px 14px", fontFamily: font, fontSize: 13,
  marginBottom: 16, display: "flex", alignItems: "center", gap: 10, lineHeight: 1.4, flexWrap: "wrap" as const,
}

export function OwnerBar({ spotId }: { spotId: number }) {
  return (
    <div style={{ ...banner, background: "#e8f5ee", border: "1px solid #b7dfc8", color: "var(--primary-dark)" }}>
      <span style={{ flex: 1 }}>🔑 Es tu lugar</span>
      <Link href={`/dashboard/spots/${spotId}`} style={{ fontWeight: 600, color: "var(--primary-dark)", textDecoration: "none" }}>
        Administrar →
      </Link>
    </div>
  )
}

export type PendingContribution = { id: number; kind: ContributionKind; title: string }

export function PendingNotice({ pending }: { pending: PendingContribution[] }) {
  if (pending.length === 0) return null
  const items = pending.map(p => `${p.title} (${KIND_LABELS[p.kind].toLowerCase()})`).join(", ")
  return (
    <div role="status" style={{ ...banner, background: "#fef9e7", border: "1px solid #f0d98a", color: "#78590a" }}>
      <span style={{ flex: 1 }}>
        ⏳ Tenés en revisión en este lugar: {items}. Se publica cuando el equipo de Rumbo lo apruebe.
      </span>
      <Link href="/profile" style={{ fontWeight: 600, color: "#78590a", textDecoration: "none" }}>Ver en tu perfil →</Link>
    </div>
  )
}
