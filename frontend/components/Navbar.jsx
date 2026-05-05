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
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const menuRef = useRef()
  const { data: session, status } = useSession()
  const isLoggedIn = status === "authenticated"
  const isActive = (path) => pathname === path

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

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
        }
        .navbar-logo:hover { opacity: 0.7; }

        /* Hamburger */
        .menu-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid #e0ddd6;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .menu-btn:hover {
          background: #f7f5f0;
          transform: translateY(-1px);
        }
        .menu-btn-line {
          width: 14px;
          height: 1.5px;
          background: #3d3d3a;
          border-radius: 2px;
          transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .menu-btn.is-open .menu-btn-line:nth-child(1) { transform: translateY(5.5px) rotate(45deg); }
        .menu-btn.is-open .menu-btn-line:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .menu-btn.is-open .menu-btn-line:nth-child(3) { transform: translateY(-5.5px) rotate(-45deg); }

        /* Dropdown */
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
        .dropdown-menu.is-open  { opacity: 1; transform: translateY(0); pointer-events: auto; }
        .dropdown-menu.is-closed { opacity: 0; transform: translateY(-6px); pointer-events: none; }

        /* Menu items */
        .menu-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 400;
          color: #3d3d3a;
          transition: background 0.15s, color 0.15s;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-family: 'DM Sans', sans-serif;
        }
        .menu-link:hover {
          background: #f7f5f0;
          color: #1b1b19;
        }
        .menu-link.active {
          background: #e8f5ee;
          color: #1b4332;
          font-weight: 600;
        }
        .menu-link.danger { color: #dc2626; }
        .menu-link.danger:hover { background: #fdf0f0; color: #b91c1c; }

        .menu-link-icon { font-size: 15px; width: 20px; text-align: center; }

        .menu-divider {
          height: 1px;
          background: #ede9e1;
          margin: 4px 6px;
        }

        .menu-user-info {
          padding: 10px 12px 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .menu-user-name {
          font-size: 13px;
          font-weight: 600;
          color: #1b1b19;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .menu-user-email {
          font-size: 11px;
          color: #9a9690;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 1px;
        }

        .signin-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #1b4332;
          background: #e8f5ee;
          border: 1px solid #b7dfc8;
          width: 100%;
          text-align: left;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s;
        }
        .signin-btn:hover { background: #d8f3dc; }

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
        .avatar-btn:hover { transform: translateY(-1px); opacity: 0.85; }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.12);
          z-index: 150;
          animation: overlayIn 0.2s ease forwards;
        }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
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

        {/* Centro: SearchBar */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }} className="hidden md:flex">
          <SearchBar compact />
        </div>

        {/* Derecha */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isLoggedIn && (
            <Link href="/profile" className="avatar-btn" aria-label="Mi perfil">
              <Avatar user={session.user} size={32} />
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            className={`menu-btn ${open ? "is-open" : ""}`}
            aria-label="Menú"
          >
            <span className="menu-btn-line" />
            <span className="menu-btn-line" />
            <span className="menu-btn-line" />
          </button>
        </div>

        {/* Overlay */}
        {open && <div className="overlay" onClick={() => setOpen(false)} />}

        {/* Dropdown */}
        <div ref={menuRef} className={`dropdown-menu ${open ? "is-open" : "is-closed"}`}>

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

          <Link href="/" onClick={() => setOpen(false)} className={`menu-link ${isActive("/") ? "active" : ""}`}>
            <span className="menu-link-icon">🏠</span> Home
          </Link>

          <Link href="/settings" onClick={() => setOpen(false)} className={`menu-link ${isActive("/settings") ? "active" : ""}`}>
            <span className="menu-link-icon">⚙️</span> Settings
          </Link>

          <div className="menu-divider" />

          {isLoggedIn ? (
            <>
              <Link href="/profile" onClick={() => setOpen(false)} className={`menu-link ${isActive("/profile") ? "active" : ""}`}>
                <span className="menu-link-icon">👤</span> Mi perfil
              </Link>
              <Link href="/favorites" onClick={() => setOpen(false)} className={`menu-link ${isActive("/favorites") ? "active" : ""}`}>
                <span className="menu-link-icon">❤️</span> Favoritos
              </Link>
              <Link href="/reviews" onClick={() => setOpen(false)} className={`menu-link ${isActive("/reviews") ? "active" : ""}`}>
                <span className="menu-link-icon">💬</span> Mis reviews
              </Link>
              <button onClick={() => { setOpen(false); signOut() }} className="menu-link danger">
                <span className="menu-link-icon">↩</span> Cerrar sesión
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