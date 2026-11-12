"use client"

// El lugar del mapa en una página con lista o texto al lado: en la compu,
// donde lo ponga la página (`className`); en el celular, con `open`, ocupa
// toda la pantalla con "✕ Cerrar mapa". Lo usan la búsqueda y las notas del
// blog. Lo de adentro lleva la clase "map-panel-inner" para perder el borde
// redondeado a pantalla completa.
import type { ReactNode } from "react"
import "./map-panel.css"

type Props = {
  open: boolean
  onClose: () => void
  className?: string
  label?: string
  children: ReactNode
}

export default function MapPanel({ open, onClose, className = "", label = "Mapa", children }: Props) {
  return (
    <div
      className={`map-panel${open ? " is-open" : ""}${className ? ` ${className}` : ""}`}
      role={open ? "dialog" : undefined}
      aria-modal={open ? true : undefined}
      aria-label={open ? label : undefined}
    >
      {children}
      <button type="button" className="map-panel-close" onClick={onClose}>
        ✕ Cerrar mapa
      </button>
    </div>
  )
}
