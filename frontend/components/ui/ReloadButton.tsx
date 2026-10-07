"use client"

import type { CSSProperties, ReactNode } from "react"

// Para pantallas de error de páginas que se arman en el servidor: recargar
// la página entera vuelve a pedir los datos.
export default function ReloadButton({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <button type="button" onClick={() => window.location.reload()} style={style}>{children}</button>
}
