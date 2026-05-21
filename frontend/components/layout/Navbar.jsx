"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signIn, signOut } from "next-auth/react"
import SearchBar from "@/components/spots/SearchBar"
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
          width: size, height: size,
          borderRadius: "50%", objectFit: "cover",
          border: "2px solid #b7dfc8",
        }}
      />
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #52b788, #1b4332)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 600, color: "#fff",
      border: "2px solid #b7dfc8", flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function Navbar() {
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()
  const menuRef  = useRef()
  const { data: session, status } = useSession()
  const isLoggedIn = status === "authenticated"
  const isActive = (path) => pathname === path

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => { setSearchOpen(false); setMenuOpen(false) }, [pathname])

  const anyOpen = menuOpen || searchOpen

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .navbar-root {
          font-family: 'DM Sans', sans-serif;
          background: rgba(245, 244, 240, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #e0ddd6;
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-logo {
          font-family: 'Playfair Display', serif;
          font-weight: 600;
          font-size: 22px;
          color: #1b1b19;
          text-decoration: none;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: opacity 0.2s;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }
        .navbar-logo:hover { opacity: 0.7; }

        .navbar-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        /* ── Botones icon compartidos ── */
        .icon-btn {
          width: 36px; height: 36px;
          border-radius: 10px;
          border: 1px solid #e0ddd6;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          position: relative; z-index: 1;
          transition: background 0.2s cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 0.2s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .icon-btn:hover { background: #f7f5f0; transform: translateY(-1px); }
        .icon-btn.is-active, .icon-btn.is-open {
          background: #1b4332;
          border-color: #1b4332;
        }
        .icon-btn.is-active:hover, .icon-btn.is-open:hover {
          background: #1b4332;
          transform: translateY(-1px);
        }

        /* Líneas — position absolute para X perfectamente centrada */
        .icon-line {
          position: absolute;
          width: 14px; height: 1.5px;
          border-radius: 2px;
          background: #3d3d3a;
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
                      opacity  0.25s cubic-bezier(0.22, 1, 0.36, 1),
                      background 0.2s;
        }
        .icon-btn.is-active .icon-line,
        .icon-btn.is-open   .icon-line { background: #fff; }

        /* Posición por defecto (hamburguesa) */
        .icon-line:nth-child(1) { transform: translateY(-5px); }
        .icon-line:nth-child(2) { }
        .icon-line:nth-child(3) { transform: translateY(5px); }

        /* X — sin translateY, ambas líneas al centro */
        .icon-btn.is-active .icon-line:nth-child(1),
        .icon-btn.is-open   .icon-line:nth-child(1) { transform: rotate(45deg); }
        .icon-btn.is-active .icon-line:nth-child(2),
        .icon-btn.is-open   .icon-line:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .icon-btn.is-active .icon-line:nth-child(3),
        .icon-btn.is-open   .icon-line:nth-child(3) { transform: rotate(-45deg); }

        /* Ícono SVG del botón de búsqueda */
        .search-svg {
          position: absolute;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        /* Líneas del botón búsqueda ocultas por defecto (el SVG las cubre) */
        .navbar-search-btn .icon-line { opacity: 0; }
        /* Al abrir: SVG desaparece, líneas forman X */
        .navbar-search-btn.is-active .search-svg   { opacity: 0; }
        .navbar-search-btn.is-active .icon-line     { opacity: 1; }
        /* La línea del medio sigue siendo 0 en X */
        .navbar-search-btn.is-active .icon-line:nth-child(2) { opacity: 0; }

        /* Solo visible en mobile */
        .navbar-search-btn { display: none; }

        /* Search dropdown */
        .navbar-search-dropdown {
          display: none;
          position: absolute;
          top: calc(100% + 10px);
          left: 16px; right: 16px;
          background: #fff;
          border: 1px solid #e0ddd6;
          border-radius: 18px;
          padding: 14px 16px;
          z-index: 200;
          box-shadow: 0 8px 28px rgba(0,0,0,0.09);
          transition: opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .navbar-search-dropdown.is-open   { opacity: 1; transform: translateY(0); pointer-events: auto; }
        .navbar-search-dropdown.is-closed { opacity: 0; transform: translateY(-6px); pointer-events: none; }

        /* Dropdown menu */
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 10px);
          right: 24px;
          width: 230px;
          background: #fff;
          border: 1px solid #e0ddd6;
          border-radius: 18px;
          padding: 6px;
          z-index: 200;
          box-shadow: 0 8px 28px rgba(0,0,0,0.09);
          transition: opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .dropdown-menu.is-open   { opacity: 1; transform: translateY(0); pointer-events: auto; }
        .dropdown-menu.is-closed { opacity: 0; transform: translateY(-6px); pointer-events: none; }

        .menu-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 10px;
          text-decoration: none; font-size: 14px; font-weight: 400;
          color: #3d3d3a;
          transition: background 0.15s, color 0.15s;
          cursor: pointer; border: none; background: none;
          width: 100%; text-align: left;
          font-family: 'DM Sans', sans-serif;
        }
        .menu-link:hover  { background: #f7f5f0; color: #1b1b19; }
        .menu-link.active { background: #e8f5ee; color: #1b4332; font-weight: 600; }
        .menu-link.danger { color: #dc2626; }
        .menu-link.danger:hover { background: #fdf0f0; color: #b91c1c; }

        .menu-link-icon { font-size: 15px; width: 20px; text-align: center; }
        .menu-divider   { height: 1px; background: #ede9e1; margin: 4px 6px; }

        .menu-user-info  { padding: 10px 12px 8px; display: flex; align-items: center; gap: 10px; }
        .menu-user-name  { font-size: 13px; font-weight: 600; color: #1b1b19; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .menu-user-email { font-size: 11px; color: #9a9690; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }

        .signin-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 10px;
          font-size: 14px; font-weight: 600;
          color: #1b4332; background: #e8f5ee; border: 1px solid #b7dfc8;
          width: 100%; text-align: left; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s;
        }
        .signin-btn:hover { background: #d8f3dc; }

        .avatar-btn {
          background: none; border: none; padding: 0;
          cursor: pointer; display: flex; align-items: center;
          border-radius: 50%;
          transition: transform 0.2s, opacity 0.2s;
          position: relative; z-index: 1;
        }
        .avatar-btn:hover { transform: translateY(-1px); opacity: 0.85; }

        .overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.12);
          z-index: 150;
          animation: overlayIn 0.2s ease forwards;
        }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .navbar-root            { padding: 14px 16px; }
          .navbar-center          { display: none; }
          .navbar-search-btn      { display: flex; }
          .navbar-search-dropdown { display: block; }
          .navbar-logo            { font-size: 19px; gap: 8px; }
          .dropdown-menu          { right: 16px; }
        }
      `}</style>

      <nav className="navbar-root">

        {/* Logo */}
        <Link
          href="/"
          className="navbar-logo"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
          }}
        >
          <Image src="/favicon-32x32.png" alt="Rumbo logo" width={36} height={36} className="object-contain" />
          Rumbo
        </Link>

        {/* Centro: SearchBar (desktop only) */}
        <div className="navbar-center">
          <SearchBar compact />
        </div>

        {/* Derecha */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

          {/* Lupa — solo mobile */}
          <button
            className={`icon-btn navbar-search-btn ${searchOpen ? "is-active" : ""}`}
            onClick={() => { setSearchOpen(!searchOpen); setMenuOpen(false) }}
            aria-label="Buscar"
          >
            <span className="icon-line" />
            <span className="icon-line" />
            <span className="icon-line" />
            <svg className="search-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {isLoggedIn && (
            <Link href="/profile" className="avatar-btn" aria-label="Mi perfil">
              <Avatar user={session.user} size={32} />
            </Link>
          )}

          {/* Hamburguesa */}
          <button
            onClick={() => { setMenuOpen(!menuOpen); setSearchOpen(false) }}
            className={`icon-btn ${menuOpen ? "is-open" : ""}`}
            aria-label="Menú"
          >
            <span className="icon-line" />
            <span className="icon-line" />
            <span className="icon-line" />
          </button>
        </div>

        {/* Overlay compartido */}
        {anyOpen && (
          <div className="overlay" onClick={() => { setMenuOpen(false); setSearchOpen(false) }} />
        )}

        {/* Search dropdown (mobile) */}
        <div className={`navbar-search-dropdown ${searchOpen ? "is-open" : "is-closed"}`}>
          <SearchBar />
        </div>

        {/* Menu dropdown */}
        <div ref={menuRef} className={`dropdown-menu ${menuOpen ? "is-open" : "is-closed"}`}>
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

          <Link href="/" onClick={() => setMenuOpen(false)} className={`menu-link ${isActive("/") ? "active" : ""}`}>
            <span className="menu-link-icon">🏠</span> Home
          </Link>
          <Link href="/settings" onClick={() => setMenuOpen(false)} className={`menu-link ${isActive("/settings") ? "active" : ""}`}>
            <span className="menu-link-icon">⚙️</span> Settings
          </Link>
          <div className="menu-divider" />

          {isLoggedIn ? (
            <>
              <Link href="/profile" onClick={() => setMenuOpen(false)} className={`menu-link ${isActive("/profile") ? "active" : ""}`}>
                <span className="menu-link-icon">👤</span> Mi perfil
              </Link>
              <Link href="/favorites" onClick={() => setMenuOpen(false)} className={`menu-link ${isActive("/favorites") ? "active" : ""}`}>
                <span className="menu-link-icon">❤️</span> Favoritos
              </Link>
              <Link href="/reviews" onClick={() => setMenuOpen(false)} className={`menu-link ${isActive("/reviews") ? "active" : ""}`}>
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

      </nav>
    </>
  )
}

export default Navbar