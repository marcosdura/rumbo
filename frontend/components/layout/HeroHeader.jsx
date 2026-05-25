"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import Image from "next/image"

function Avatar({ user, size = 32 }) {
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  if (user?.image) {
    return (
      <img
        src={user.image}
        alt={user.name ?? "Usuario"}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.4)" }}
      />
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "rgba(255,255,255,0.15)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 600, color: "#fff",
      border: "2px solid rgba(255,255,255,0.35)", flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

export default function HeroHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef   = useRef()
  const { data: session, status } = useSession()
  const isLoggedIn = status === "authenticated"

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 32,
    }}>

      {/* Logo + Name */}
      <Link href="/" style={{
        display: "flex", alignItems: "center", gap: 10,
        textDecoration: "none",
        fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 22, color: "#fff",
      }}>
        <Image src="/favicon-32x32.png" alt="Rumbo logo" width={36} height={36} style={{ borderRadius: 8 }} />
        Rumbo
      </Link>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

        {isLoggedIn ? (
          <Link href="/profile" style={{ display: "flex", borderRadius: "50%", transition: "opacity 0.2s" }}>
            <Avatar user={session.user} />
          </Link>
        ) : (
          <>
            <button className="signin-nav-btn" onClick={() => signIn("google", {}, { prompt: "select_account" })}>
              Iniciar sesión
            </button>
            <button className="avatar-btn signin-avatar-mobile" onClick={() => signIn("google", {}, { prompt: "select_account" })} aria-label="Iniciar sesión">
              <Avatar user={null} />
            </button>
          </>
        )}

        {/* Hamburger + dropdown */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            className={`icon-btn ${menuOpen ? "is-open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            <span className="icon-line" />
            <span className="icon-line" />
            <span className="icon-line" />
          </button>

          <div className={`dropdown-menu ${menuOpen ? "is-open" : "is-closed"}`}>
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

            <Link href="/" onClick={() => setMenuOpen(false)} className="menu-link active">
              <span className="menu-link-icon">🏠</span> Home
            </Link>
            <Link href="/settings" onClick={() => setMenuOpen(false)} className="menu-link">
              <span className="menu-link-icon">⚙️</span> Settings
            </Link>
            <div className="menu-divider" />

            {isLoggedIn ? (
              <>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="menu-link">
                  <span className="menu-link-icon">👤</span> Mi perfil
                </Link>
                <Link href="/favorites" onClick={() => setMenuOpen(false)} className="menu-link">
                  <span className="menu-link-icon">❤️</span> Favoritos
                </Link>
                <Link href="/reviews" onClick={() => setMenuOpen(false)} className="menu-link">
                  <span className="menu-link-icon">💬</span> Mis reviews
                </Link>
                <button onClick={() => { setMenuOpen(false); signOut() }} className="menu-link danger">
                  <span className="menu-link-icon">↩</span> Cerrar sesión
                </button>
              </>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); signIn("google", {}, { prompt: "select_account" }) }}
                className="signin-btn"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Iniciar sesión con Google
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
