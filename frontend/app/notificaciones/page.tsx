"use client"

// Todas las notificaciones del usuario (la campanita del Navbar muestra las
// últimas), con el mismo armazón que las páginas del menú del perfil. Marcar
// como leídas acá baja también el número de la campanita (antes seguía
// hasta recargar).
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { NotificationItem } from "@/components/layout/NotificationBell"
import { setUnread } from "@/components/layout/unreadStore"
import ProfileSubpage from "@/app/profile/ProfileSubpage"
import { api } from "@/lib/api"
import { card } from "@/lib/theme"
import type { AppNotification, NotificationList } from "@/lib/notifications"

const PAGE_SIZE = 50

const textButton = { fontSize: 13, color: "var(--muted-strong)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }

function Notifications({ token }: { token: string }) {
  const router = useRouter()
  const [items, setItems] = useState<AppNotification[] | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get<NotificationList>("/notifications/", { token, params: { limit: PAGE_SIZE } })
      .then(({ data }) => { setItems(data.items); setHasMore(!!data.has_more); setUnread(data.unread) })
      .catch(() => setError(true))
  }, [token])

  async function loadMore() {
    if (!items) return
    setLoadingMore(true)
    try {
      const { data } = await api.get<NotificationList>("/notifications/", { token, params: { limit: PAGE_SIZE, offset: items.length } })
      setItems(prev => [...(prev ?? []), ...data.items])
      setHasMore(!!data.has_more)
    } catch {
      setError(true)
    }
    setLoadingMore(false)
  }

  function open(n: AppNotification) {
    if (!n.read) {
      setItems(prev => prev?.map(i => (i.id === n.id ? { ...i, read: true } : i)) ?? null)
      setUnread(u => Math.max(0, u - 1))
      api.post(`/notifications/${n.id}/read`, undefined, { token }).catch(() => {})
    }
    if (n.link) router.push(n.link)
  }

  async function markAll() {
    setItems(prev => prev?.map(i => ({ ...i, read: true })) ?? null)
    setUnread(0)
    await api.post("/notifications/read-all", undefined, { token }).catch(() => {})
  }

  const unread = items?.filter(i => !i.read).length ?? 0

  return (
    <>
      {unread > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={markAll} style={textButton}>Marcar todas como leídas</button>
        </div>
      )}
      <div style={{ ...card, padding: 8 }}>
        {error && !items ? (
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
      {hasMore && (
        <div style={{ textAlign: "center" }}>
          <button type="button" onClick={loadMore} disabled={loadingMore} style={{ ...textButton, fontWeight: 600, color: "var(--primary)" }}>
            {loadingMore ? "Cargando..." : "Ver más"}
          </button>
        </div>
      )}
      {error && items && <p style={{ fontSize: 13, color: "var(--danger)", margin: 0, textAlign: "center" }}>No se pudieron cargar más. Probá de nuevo.</p>}
    </>
  )
}

export default function NotificationsPage() {
  return (
    <ProfileSubpage title="Notificaciones">
      {token => <Notifications token={token} />}
    </ProfileSubpage>
  )
}
