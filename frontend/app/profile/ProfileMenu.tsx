"use client"

import Link from "next/link"
import Pill from "@/components/ui/Pill"
import type { ProfileMenuRow } from "@/lib/profile"
import { s } from "./styles"

// El menú del perfil: una fila por sección, como el menú del Navbar
// (mismo hover y radio), con su número y lo que pide atención.
export default function ProfileMenu({ rows }: { rows: ProfileMenuRow[] }) {
  return (
    <nav aria-label="Secciones del perfil" className="fade-up fade-up-3" style={{ ...s.card, padding: 8 }}>
      <style>{`
        .profile-menu-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px; border-radius: 12px; text-decoration: none;
          transition: background 0.15s;
        }
        .profile-menu-row:hover { background: #f7f5f0; }
        .profile-menu-row + .profile-menu-row { border-top: 1px solid #ede9e1; }
      `}</style>
      {rows.map(row => (
        <Link key={row.href} href={row.href} className="profile-menu-row">
          <span aria-hidden="true" style={s.actionBtnIcon}>{row.icon}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>{row.title}</span>
              {row.badge && <Pill variant={row.badge.variant} size="sm">{row.badge.text}</Pill>}
            </span>
            <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{row.hint}</span>
          </span>
          {row.count > 0 && <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted-strong)" }}>{row.count}</span>}
          <span aria-hidden="true" style={{ fontSize: 14, color: "var(--muted)" }}>→</span>
        </Link>
      ))}
    </nav>
  )
}
