"use client"

import { s } from "./styles"

interface Props {
  userName?: string | null
  userEmail?: string | null
  userImage?: string | null
  joinDate: string
}

export default function ProfileInfoCard({ userName, userEmail, userImage, joinDate }: Props) {
  const initials = userName
    ? userName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  return (
    <div className="fade-up fade-up-2" style={{ ...s.card, padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid #b7dfc8", padding: 3, flexShrink: 0 }}>
          {userImage ? (
            <img src={userImage} alt={userName ?? ""} referrerPolicy="no-referrer"
              style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "linear-gradient(135deg, #52b788, var(--primary-dark))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 600, color: "#fff" }}>
              {initials}
            </div>
          )}
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 18, fontWeight: 600, color: "#1b1b19", margin: "0 0 3px" }}>
            {userName}
          </p>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
            Miembro desde {joinDate}
          </p>
        </div>
      </div>

      <div>
        {[
          { icon: "✉️", label: "Email", value: userEmail },
          { icon: "🔗", label: "Cuenta conectada", value: "Google" },
        ].map((row, i, arr) => (
          <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #ede9e1" : "none" }}>
            <div style={s.infoIcon}>{row.icon}</div>
            <div>
              <p style={s.infoLabel}>{row.label}</p>
              <p style={{ ...s.infoValue, fontSize: 13 }}>{row.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
