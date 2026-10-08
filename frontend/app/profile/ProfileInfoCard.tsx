"use client"

import { s } from "./styles"

interface Props {
  userName?: string | null
  userEmail?: string | null
  userImage?: string | null
  // "octubre de 2026", o null si no se sabe.
  memberSince: string | null
  // "8 favoritos · 12 reseñas · 3 lugares", o null si todavía no hay nada.
  summary: string | null
}

// Arriba del perfil, a lo ancho: quién sos y un resumen corto.
export default function ProfileInfoCard({ userName, userEmail, userImage, memberSince, summary }: Props) {
  const initials = userName
    ? userName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  return (
    <div className="fade-up fade-up-2" style={{ ...s.card, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid #b7dfc8", padding: 3, flexShrink: 0 }}>
        {userImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar de Google, necesita referrerPolicy
          <img src={userImage} alt={userName ?? ""} referrerPolicy="no-referrer"
            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "linear-gradient(135deg, #52b788, var(--primary-dark))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 600, color: "#fff" }}>
            {initials}
          </div>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 20, fontWeight: 600, color: "#1b1b19", margin: "0 0 2px" }}>
          {userName}
        </p>
        <p style={{ fontSize: 13, color: "var(--muted-strong)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {userEmail}
          {memberSince && <span style={{ color: "var(--muted)" }}> · Miembro desde {memberSince}</span>}
        </p>
        {summary && (
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "6px 0 0" }}>{summary}</p>
        )}
      </div>
    </div>
  )
}
