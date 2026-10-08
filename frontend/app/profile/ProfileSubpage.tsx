"use client"

// Armazón de las páginas a las que lleva el menú del perfil (Lugares que
// administrás, Mis aportes, Mis pedidos): el mismo encabezado que Mis
// reviews y Favoritos, con "← Volver al perfil". Sin sesión vuelve al
// inicio, como /notificaciones.
import { useEffect, type ReactNode } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import LoadingScreen from "@/components/ui/LoadingScreen"
import Pill from "@/components/ui/Pill"

export default function ProfileSubpage({ title, count, children }: {
  title: string
  // Cantidad junto al título (como "Mis reviews"); 0 o undefined no se muestra.
  count?: number
  children: (token: string) => ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  if (status === "loading" || !session?.id_token) return <LoadingScreen />

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`
        .profile-sub-wrapper { max-width: 768px; width: 100%; margin: 0 auto; padding: 40px 24px 64px; box-sizing: border-box; }
        .profile-sub-title   { font-family: var(--font-playfair-display), serif; font-size: 36px; font-weight: 600; color: #1b1b19; margin: 0; line-height: 1.2; }
        @media (max-width: 768px) {
          .profile-sub-wrapper { padding: 24px 16px 48px; }
          .profile-sub-title   { font-size: 26px; }
        }
      `}</style>
      <Navbar />
      <div className="profile-sub-wrapper">
        {/* Mismo link que "← Volver al perfil" del dashboard. */}
        <Link href="/profile" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
          ← Volver al perfil
        </Link>
        <div className="fade-up fade-up-1" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
              Tu cuenta
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <h1 className="profile-sub-title">{title}</h1>
            {!!count && (
              <Pill variant="dark-green" hover style={{ fontSize: 12, padding: "3px 12px", flexShrink: 0 }}>{count}</Pill>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {children(session.id_token)}
        </div>
      </div>
    </div>
  )
}
