"use client"

// Campanita del Navbar: cantidad de avisos sin leer y los últimos, con
// acceso a /notificaciones. Solo para usuarios con sesión.
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { badgeText, notificationIcon, timeAgo, type AppNotification, type NotificationList } from "@/lib/notifications"

// Cada cuánto se vuelve a mirar si hay avisos nuevos (solo con la pestaña
// visible). Es un número: una consulta liviana.
const POLL_MS = 60_000

export default function NotificationBell({ token }: { token: string }) {
  const router = useRouter()
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[] | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const refreshCount = () =>
      api.get<{ unread: number }>("/notifications/unread-count", { token })
        .then(({ data }) => setUnread(data.unread))
        .catch(() => {})  // sin el número la app funciona igual
    refreshCount()
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refreshCount()
    }, POLL_MS)
    return () => clearInterval(id)
  }, [token])

  // Cerrar al tocar afuera, como el menú del Navbar.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next) {
      try {
        const { data } = await api.get<NotificationList>("/notifications/", { token, params: { limit: 8 } })
        setItems(data.items)
        setUnread(data.unread)
      } catch {
        setItems([])
      }
    }
  }

  async function openItem(n: AppNotification) {
    setOpen(false)
    if (!n.read) {
      setUnread(u => Math.max(0, u - 1))
      setItems(prev => prev?.map(i => (i.id === n.id ? { ...i, read: true } : i)) ?? null)
      api.post(`/notifications/${n.id}/read`, undefined, { token }).catch(() => {})
    }
    if (n.link) router.push(n.link)
  }

  async function markAll() {
    setUnread(0)
    setItems(prev => prev?.map(i => ({ ...i, read: true })) ?? null)
    await api.post("/notifications/read-all", undefined, { token }).catch(() => {})
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Mismo botón que la lupa y la hamburguesa del Navbar. */}
      <button
        className="icon-btn"
        onClick={toggle}
        aria-label={unread ? `Notificaciones (${unread} sin leer)` : "Notificaciones"}
        aria-expanded={open}
        style={{ color: "#fff" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, padding: "0 5px",
            borderRadius: 9, background: "var(--danger)", color: "#fff", fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box",
            fontFamily: "var(--font-dm-sans), sans-serif",
          }}>
            {badgeText(unread)}
          </span>
        )}
      </button>

      {open && (
        // Misma tarjeta que el menú del Navbar (.dropdown-menu).
        <div role="dialog" aria-label="Notificaciones" style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0, width: 320, maxWidth: "calc(100vw - 32px)",
          background: "#fff", border: "1px solid var(--border)", borderRadius: 18, padding: 6, zIndex: 200,
          boxShadow: "0 8px 28px rgba(0,0,0,0.09)", fontFamily: "var(--font-dm-sans), sans-serif",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px 6px" }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--primary)" }}>Notificaciones</span>
            {unread > 0 && (
              <button onClick={markAll} style={{ fontSize: 12, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {items === null ? (
              <p style={{ fontSize: 13, color: "var(--muted)", padding: "10px 12px", margin: 0 }}>Cargando...</p>
            ) : items.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--muted)", padding: "10px 12px", margin: 0 }}>No tenés notificaciones.</p>
            ) : items.map(n => <NotificationItem key={n.id} n={n} onOpen={openItem} />)}
          </div>
          <div style={{ height: 1, background: "#ede9e1", margin: "4px 6px" }} />
          <Link href="/notificaciones" onClick={() => setOpen(false)}
            style={{ display: "block", textAlign: "center", padding: "9px 12px", fontSize: 13, fontWeight: 600, color: "var(--primary)", textDecoration: "none", borderRadius: 10 }}>
            Ver todas
          </Link>
        </div>
      )}
    </div>
  )
}

// Fila de un aviso: la usan la campanita y /notificaciones.
export function NotificationItem({ n, onOpen }: { n: AppNotification; onOpen: (n: AppNotification) => void }) {
  return (
    <button
      onClick={() => onOpen(n)}
      style={{
        display: "flex", gap: 10, width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10,
        border: "none", cursor: n.link ? "pointer" : "default", fontFamily: "inherit",
        background: n.read ? "none" : "#f0f7f3",
      }}
    >
      <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.3 }} aria-hidden="true">{notificationIcon(n.kind)}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: n.read ? 400 : 600, color: "#1b1b19", lineHeight: 1.4 }}>{n.title}</span>
        {n.body && <span style={{ display: "block", fontSize: 12, color: "var(--muted-strong)", lineHeight: 1.4, marginTop: 2 }}>{n.body}</span>}
        <span style={{ display: "block", fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{timeAgo(n.created_at)}</span>
      </span>
      {!n.read && <span aria-label="Sin leer" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0, marginTop: 5 }} />}
    </button>
  )
}
