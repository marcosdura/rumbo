"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import Image from "next/image"
import AuthModal from "@/components/layout/AuthModal"
import NotificationBell from "@/components/layout/NotificationBell"
import MenuLinks from "@/components/layout/MenuLinks"

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
  const [authModalOpen, setAuthModalOpen] = useState(false)
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
        fontFamily: "var(--font-nunito)", fontWeight: 600, fontSize: 22, color: "#fff",
      }}>
      <Image
        src="/RumboLogo.png"
        alt="Rumbo logo"
        width={36}
        height={36}
        className="object-contain"
        style={{ borderRadius: 8 }}
      />
      rumbo
      </Link>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

        {/* Lo mismo que el Navbar (que en la home se oculta hasta pasar el
            hero): si se suma algo allá, va también acá. */}
        <Link href="/agregar-lugar" className="signin-nav-btn addplace-nav-btn">
          ＋ Agregar lugar
        </Link>

        {isLoggedIn && session?.id_token && <NotificationBell token={session.id_token} />}

        {isLoggedIn ? (
          <Link href="/profile" style={{ display: "flex", borderRadius: "50%", transition: "opacity 0.2s" }}>
            <Avatar user={session.user} />
          </Link>
        ) : (
          <>
            <button className="signin-nav-btn" onClick={() => setAuthModalOpen(true)}>
              Iniciar sesión
            </button>
            <button className="avatar-btn signin-avatar-mobile" onClick={() => setAuthModalOpen(true)} aria-label="Iniciar sesión">
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
            <MenuLinks
              session={session} isLoggedIn={isLoggedIn} Avatar={Avatar} pathname="/"
              onClose={() => setMenuOpen(false)} onSignIn={() => setAuthModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
    </div>
  )
}
