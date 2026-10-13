"use client"

import { usePathname } from "next/navigation"

// usePathname, pero la home siempre es "/". Cuando Vercel regenera la home
// (ISR, cada 10 minutos) Next la arma como "/index": el Navbar creía que no
// estaba en la home y se mostraba fijo arriba de la barra del hero (dos
// barras). En local, el build la arma como "/" y no pasaba.
export function normalizePath(pathname: string | null): string {
  if (!pathname || pathname === "/index") return "/"
  return pathname
}

export function usePath(): string {
  return normalizePath(usePathname())
}
