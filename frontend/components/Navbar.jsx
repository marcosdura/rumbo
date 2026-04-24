"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signIn, signOut } from "next-auth/react"
import SearchBar from "./SearchBar"
import Image from "next/image"

function Avatar({ user, size = 28 }) {
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
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid rgba(110,231,183,0.5)",
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #6ee7b7, #3b82f6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 500,
        color: "#fff",
        border: "2px solid rgba(110,231,183,0.5)",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const menuRef = useRef()
  const { data: session, status } = useSession()
  const isLoggedIn = status === "authenticated"

  const isActive = (path) => pathname === path

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

        .navbar-root {
          font-family: 'DM Sans', sans-serif;
          background: rgba(245, 244, 240, 0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(0,0,0,0.07);
        }

        .navbar-logo {
          font-family: 'Playfair Display', serif;
          font-weight: 600;
          font-size: 23px;
          color: #1a1a1a;
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: opacity 0.2s;
        }
        .navbar-logo:hover {
          opacity: 0.7;
          transform: translateY(-1px);
        }

        .menu-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.1);
          background: rgba(255,255,255,0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .menu-btn:hover {
          background: rgba(255,255,255,0.95);
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(0,0,0,0.08);
        }
        .menu-btn-line {
          width: 14px;
          height: 1.5px;
          background: #444;
          border-radius: 2px;
          transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .menu-btn.is-open .menu-btn-line:nth-child(1) {
          transform: translateY(5.5px) rotate(45deg);
        }
        .menu-btn.is-open .menu-btn-line:nth-child(2) {
          opacity: 0; transform: scaleX(0);
        }
        .menu-btn.is-open .menu-btn-line:nth-child(3) {
          transform: translateY(-5.5px) rotate(-45deg);
        }

        .search-input {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          width: 300px;
          padding: 8px 18px;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,0.1);
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(8px);
          outline: none;
          transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
          color: #1a1a1a;
        }
        .search-input::placeholder { color: #aaa; }
        .search-input:focus {
          background: rgba(255,255,255,0.97);
          border-color: #6ee7b7;
          box-shadow: 0 0 0 3px rgba(110,231,183,0.2);
          width: 340px;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 22px;
          width: 220px;
          background: rgba(245, 244, 240, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 16px;
          padding: 6px;
          z-index: 200;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
          transition: opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .dropdown-menu.is-open {
          opacity: 1; transform: translateY(0); pointer-events: auto;
        }
        .dropdown-menu.is-closed {
          opacity: 0; transform: translateY(-6px); pointer-events: none;
        }

        .menu-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 400;
          color: #374151;
          transition: background 0.18s, color 0.18s;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-family: 'DM Sans', sans-serif;
        }
        .menu-link:hover {
          background: rgba(255,255,255,0.8);
          color: #111;
        }
        .menu-link.active {
          background: linear-gradient(135deg, #e8e3d8, #c6bdaa);
          color: #4a443b;
          font-weight: 500;
        }
        .menu-link.danger {
          color: #dc2626;
        }
        .menu-link.danger:hover {
          background: rgba(220,38,38,0.06);
          color: #b91c1c;
        }
        .menu-link-icon {
          font-size: 15px;
          width: 20px;
          text-align: center;
        }

        .menu-divider {
          height: 1px;
          background: rgba(0,0,0,0.07);
          margin: 4px 6px;
        }

        .menu-user-info {
          padding: 8px 12px 6px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .menu-user-name {
          font-size: 13px;
          font-weight: 500;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .menu-user-email {
          font-size: 11px;
          color: #888;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .signin-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #1a6ef5;
          background: rgba(59,130,246,0.07);
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.18s, color 0.18s;
        }
        .signin-btn:hover {
          background: rgba(59,130,246,0.13);
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.15);
          z-index: 150;
          animation: overlayIn 0.2s ease forwards;
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .avatar-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          border-radius: 50%;
          transition: transform 0.2s, opacity 0.2s;
        }
        .avatar-btn:hover {
          transform: translateY(-1px);
          opacity: 0.85;
        }
      `}</style>

      <nav className="navbar-root px-5 py-5 flex items-center justify-between relative" style={{ zIndex: 100 }}>

        {/* IZQUIERDA: logo */}
        <Link href="/" className="flex items-center gap-2 navbar-logo">
          <Image
            src="/favicon-32x32.png"
            alt="Rumbo logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="navbar-logo">Rumbo</span>
        </Link>

        {/* CENTRO: buscador */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex">
          <SearchBar compact />
        </div>

        {/* DERECHA: avatar (si está logueado) + botón menú */}
        <div className="flex items-center gap-2">
          {isLoggedIn && (
            <Link
              href="/profile"
              className="avatar-btn"
              aria-label="Abrir menú de usuario"
            >
              <Avatar user={session.user} size={32} />
            </Link>
          )}

          <button
            onClick={() => setOpen(!open)}
            className={`menu-btn ${open ? "is-open" : ""}`}
            aria-label="Menú"
          >
            <span className="menu-btn-line"></span>
            <span className="menu-btn-line"></span>
            <span className="menu-btn-line"></span>
          </button>
        </div>

        {/* Overlay */}
        {open && <div className="overlay" />}

        {/* Menú desplegable */}
        <div
          ref={menuRef}
          className={`dropdown-menu ${open ? "is-open" : "is-closed"}`}
        >
          {/* Info del usuario si está logueado */}
          {isLoggedIn && (
            <>
              <div className="menu-user-info">
                <Avatar user={session.user} size={30} />
                <div style={{ minWidth: 0 }}>
                  <div className="menu-user-name">{session.user?.name}</div>
                  <div className="menu-user-email">{session.user?.email}</div>
                </div>
              </div>
              <div className="menu-divider" />
            </>
          )}

          {/* Links de navegación */}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={`menu-link ${isActive("/") ? "active" : ""}`}
          >
            <span className="menu-link-icon">🏠</span>
            Home
          </Link>

          <Link
            href="/spots"
            onClick={() => setOpen(false)}
            className={`menu-link ${isActive("/spots") ? "active" : ""}`}
          >
            <span className="menu-link-icon">🏔️</span>
            Spots
          </Link>

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className={`menu-link ${isActive("/settings") ? "active" : ""}`}
          >
            <span className="menu-link-icon">⚙️</span>
            Settings
          </Link>

          {/* Sección de perfil / auth */}
          <div className="menu-divider" />

          {isLoggedIn ? (
            <>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className={`menu-link ${isActive("/profile") ? "active" : ""}`}
              >
                <span className="menu-link-icon">👤</span>
                Mi perfil
              </Link>

              <button
                onClick={() => { setOpen(false); signOut() }}
                className="menu-link danger"
              >
                <span className="menu-link-icon">↩</span>
                Cerrar sesión
              </button>
            </>
          ) : (
            <button
              onClick={() => { setOpen(false); signIn("google", {}, { prompt: "select_account" }) }}
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

      </nav>
    </>
  )
}

export default Navbar