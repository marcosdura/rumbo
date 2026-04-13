"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const menuRef = useRef()

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
          font-size: 18px;
          color: #1a1a1a;
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: opacity 0.2s;
        }
        .navbar-logo:hover { opacity: 0.7; }

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
          left: 12px;
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
        }
        .menu-link:hover {
          background: rgba(255,255,255,0.8);
          color: #111;
        }
        .menu-link.active {
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          color: #065f46;
          font-weight: 500;
        }
        .menu-link-icon {
          font-size: 15px;
          width: 20px;
          text-align: center;
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
      `}</style>

      <nav className="navbar-root px-5 py-3 flex items-center justify-between relative" style={{ zIndex: 100 }}>


        {/* Izquierda */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(!open)}
            className={`menu-btn ${open ? "is-open" : ""}`}
            aria-label="Menú"
          >
            <span className="menu-btn-line"></span>
            <span className="menu-btn-line"></span>
            <span className="menu-btn-line"></span>
          </button>

          <Link href="/" className="navbar-logo">
            Travel App
          </Link>
        </div>

        {/* Buscador centrado */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <input
            type="text"
            placeholder="Buscar spots..."
            className="search-input"
          />
        </div>

        {/* Overlay */}
        {open && <div className="overlay" />}

        {/* Menú desplegable */}
        <div
          ref={menuRef}
          className={`dropdown-menu ${open ? "is-open" : "is-closed"}`}
        >
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
        </div>

      </nav>
    </>
  )
}

export default Navbar