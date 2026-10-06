"use client"

// Todas las notificaciones del usuario (la campanita del Navbar muestra las
// últimas).
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import { NotificationItem } from "@/components/layout/NotificationBell"
import { api } from "@/lib/api"
import { card } from "@/lib/theme"
import type { AppNotification, NotificationList } from "@/lib/notifications"

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const token = session?.id_token
  const [items, setItems] = useState<AppNotification[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) router.push("/")
  }, [session, status])

  useEffect(() => {
    if (!token) return
    api.get<NotificationList>("/notifications/", { token, params: { limit: 100 } })
      .then(({ data }) => setItems(data.items))
      .catch(() => setError(true))
  }, [token])

  function open(n: AppNotification) {
    if (!n.read) {
      setItems(prev => prev?.map(i => (i.id === n.id ? { ...i, read: true } : i)) ?? null)
      api.post(`/notifications/${n.id}/read`, undefined, { token }).catch(() => {})
    }
    if (n.link) router.push(n.link)
  }

  async function markAll() {
    setItems(prev => prev?.map(i => ({ ...i, read: true })) ?? null)
    await api.post("/notifications/read-all", undefined, { token }).catch(() => {})
  }

  const unread = items?.filter(i => !i.read).length ?? 0

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 60px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 26, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
            Notificaciones
          </h1>
          {unread > 0 && (
            <button onClick={markAll} style={{ fontSize: 13, color: "var(--muted-strong)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              Marcar todas como leídas
            </button>
          )}
        </div>

        <div style={{ ...card, padding: 8 }}>
          {error ? (
            <p style={{ fontSize: 14, color: "var(--danger)", padding: 16, margin: 0 }}>No se pudieron cargar. Recargá la página.</p>
          ) : items === null ? (
            <p style={{ fontSize: 14, color: "var(--muted)", padding: 16, margin: 0 }}>Cargando...</p>
          ) : items.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--muted)", padding: 16, margin: 0, lineHeight: 1.5 }}>
              No tenés notificaciones. Acá vas a ver cuando se aprueben tus lugares y aportes, o cuando te dejen una reseña.
            </p>
          ) : (
            items.map(n => <NotificationItem key={n.id} n={n} onOpen={open} />)
          )}
        </div>
      </div>
    </div>
  )
}
