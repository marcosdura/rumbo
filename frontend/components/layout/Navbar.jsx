"use client"

import { useState, useEffect } from "react"
import { usePath } from "@/lib/usePath"
import SearchBar from "@/components/spots/SearchBar"
import NavBarContent from "@/components/layout/NavBarContent"

// La barra fija de todas las páginas: NavBarContent (la misma que el hero de
// la home) más el buscador. En la home arranca oculta y aparece cuando el
// hero sale de pantalla, en el mismo lugar donde estaba la del hero.
function Navbar() {
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [heroGone,   setHeroGone]   = useState(false)
  const pathname = usePath()
  const isHome = pathname === "/"

  // Al cambiar de página: se cierran el menú y la búsqueda, y en la home el
  // Navbar arranca oculto hasta que el observer diga que el hero ya pasó.
  // Se ajusta durante el render (no en un efecto) para no pintar un cuadro
  // con el estado de la página anterior.
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setHeroGone(false)
    setSearchOpen(false)
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!isHome) return
    const hero = document.getElementById("hero-section")
    if (!hero) return
    const observer = new IntersectionObserver(
      ([entry]) => setHeroGone(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [isHome, pathname])

  // Escape cierra el buscador (el menú lo cierra NavBarContent).
  useEffect(() => {
    if (!searchOpen) return
    const onKey = (e) => { if (e.key === "Escape") setSearchOpen(false) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [searchOpen])

  return (
    // Oculta sobre el hero, también para el teclado y el lector de pantalla
    // (inert): antes Tab entraba en sus botones invisibles.
    <nav
      className={`navbar-root${isHome ? ` navbar-home-fixed${heroGone ? " navbar-visible" : ""}` : ""}`}
      inert={isHome && !heroGone ? true : undefined}
    >
      <style>{`
        .navbar-root {
          font-family: var(--font-dm-sans), sans-serif;
          background: linear-gradient(160deg, var(--primary-dark) 0%, var(--primary) 65%, #40916c 100%);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .navbar-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        /* Ícono SVG del botón de búsqueda */
        .search-svg {
          position: absolute;
          transition: opacity 0.2s;
          pointer-events: none;
          stroke: #fff;
        }
        /* Líneas del botón búsqueda ocultas por defecto (el SVG las cubre) */
        .navbar-search-btn .icon-line { opacity: 0; }
        /* Al abrir: SVG desaparece, líneas forman X */
        .navbar-search-btn.is-active .search-svg   { opacity: 0; }
        .navbar-search-btn.is-active .icon-line     { opacity: 1; }
        /* La línea del medio sigue siendo 0 en X */
        .navbar-search-btn.is-active .icon-line:nth-child(2) { opacity: 0; }

        /* Solo visible en mobile. Con .navbar-root delante: .icon-btn (display:
           flex) viene en el CSS de NavBarContent, que carga después. */
        .navbar-root .navbar-search-btn { display: none; }

        /* Search dropdown */
        .navbar-search-dropdown {
          display: none;
          position: absolute;
          top: calc(100% + 10px);
          left: 16px; right: 16px;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 14px 16px;
          z-index: 200;
          box-shadow: 0 8px 28px rgba(0,0,0,0.09);
          transition: opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .navbar-search-dropdown.is-open   { opacity: 1; transform: translateY(0); pointer-events: auto; }
        .navbar-search-dropdown.is-closed { opacity: 0; transform: translateY(-6px); pointer-events: none; }

        /* ── Home: fixed, oculto sobre el hero, visible cuando el hero sale ── */
        .navbar-home-fixed {
          position: fixed;
          top: 0; left: 0; right: 0;
          opacity: 0;
          pointer-events: none;
          transform: translateY(-6px);
          transition: opacity 0.25s ease, transform 0.25s ease;
        }
        .navbar-home-fixed.navbar-visible {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }


        @media (max-width: 768px) {
          .navbar-center          { display: none; }
          .navbar-root .navbar-search-btn { display: flex; }
          .navbar-search-dropdown { display: block; }
        }
      `}</style>

      <NavBarContent
        menuOpen={menuOpen}
        setMenuOpen={(open) => { setMenuOpen(open); if (open) setSearchOpen(false) }}
        pathname={pathname}
        center={
          <div className="navbar-center">
            <SearchBar compact />
          </div>
        }
        beforeActions={
          /* Lupa — solo mobile */
          <button
            className={`icon-btn navbar-search-btn ${searchOpen ? "is-active" : ""}`}
            onClick={() => { setSearchOpen(!searchOpen); setMenuOpen(false) }}
            aria-label="Buscar"
            aria-expanded={searchOpen}
          >
            <span className="icon-line" />
            <span className="icon-line" />
            <span className="icon-line" />
            <svg className="search-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        }
      />

      {searchOpen && <div className="overlay" onClick={() => setSearchOpen(false)} />}

      {/* Search dropdown (mobile) */}
      <div className={`navbar-search-dropdown ${searchOpen ? "is-open" : "is-closed"}`}>
        <SearchBar onSearch={() => setSearchOpen(false)} />
      </div>
    </nav>
  )
}

export default Navbar
