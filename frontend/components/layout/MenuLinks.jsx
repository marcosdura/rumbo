"use client"

// Lo de adentro del menú (hamburguesa), igual en el Navbar y en el
// encabezado del hero de la home. Antes estaba copiado en los dos y se
// desincronizaban (el hero se quedó sin "Agregar lugar").
import Link from "next/link"
import { signOut } from "next-auth/react"

export const MENU_LINKS = [
  { href: "/", icon: "🏠", label: "Home" },
  { href: "/agregar-lugar", icon: "➕", label: "Agregar lugar" },
]

export const USER_LINKS = [
  { href: "/profile", icon: "👤", label: "Mi perfil" },
  { href: "/favorites", icon: "❤️", label: "Favoritos" },
  { href: "/reviews", icon: "💬", label: "Mis reviews" },
]

export default function MenuLinks({ session, isLoggedIn, Avatar, pathname, onClose, onSignIn }) {
  const cls = (href) => `menu-link ${pathname === href ? "active" : ""}`
  return (
    <>
      {isLoggedIn && (
        <>
          <div className="menu-user-info">
            <Avatar user={session.user} size={32} />
            <div style={{ minWidth: 0 }}>
              <div className="menu-user-name">{session.user?.name}</div>
              <div className="menu-user-email">{session.user?.email}</div>
            </div>
          </div>
          <div className="menu-divider" />
        </>
      )}

      {MENU_LINKS.map(l => (
        <Link key={l.href} href={l.href} onClick={onClose} className={cls(l.href)}>
          <span className="menu-link-icon">{l.icon}</span> {l.label}
        </Link>
      ))}
      <div className="menu-divider" />

      {isLoggedIn ? (
        <>
          {USER_LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={onClose} className={cls(l.href)}>
              <span className="menu-link-icon">{l.icon}</span> {l.label}
            </Link>
          ))}
          <button onClick={() => { onClose(); signOut() }} className="menu-link danger">
            <span className="menu-link-icon">↩</span> Cerrar sesión
          </button>
        </>
      ) : (
        <button onClick={() => { onClose(); onSignIn() }} className="signin-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Iniciar sesión con Google
        </button>
      )}
    </>
  )
}
