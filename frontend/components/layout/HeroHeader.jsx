"use client"

import { useState } from "react"
import NavBarContent from "@/components/layout/NavBarContent"

// La barra de arriba del hero de la home: la misma que el Navbar
// (NavBarContent), sobre el verde del hero. Así no salta al pasar de otra
// página a la home, ni cuando aparece el Navbar fijo al bajar.
export default function HeroHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  return <NavBarContent menuOpen={menuOpen} setMenuOpen={setMenuOpen} pathname="/" />
}
