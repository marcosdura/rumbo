"use client"

import { useEffect, useRef, type RefObject } from "react"

// Lo que ningún modal del sitio hacía: cerrar con Escape, atrapar el foco
// adentro (Tab/Shift+Tab ciclando), enfocar algo al abrir, devolver el foco a
// quien lo abrió al cerrar, y frenar el scroll de la página de atrás.
//
// Devuelve el ref que va en el panel del modal. El panel además debería
// llevar role="dialog" aria-modal="true" y un aria-labelledby/aria-label.
//
// Los dos lightboxes (PhotoLightbox, ImageGallery) ya hacían Escape y scroll
// lock por su cuenta con el mismo useEffect duplicado; al usar este hook lo
// borran y se quedan solo con su handler de ArrowLeft/ArrowRight, que sí es
// propio.

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",")

export function useModalA11y(
  open: boolean,
  onClose: () => void,
  initialFocusRef?: RefObject<HTMLElement | null>,
) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Casi todos los modales pasan onClose como arrow inline, que cambia en
  // cada render. Sin este ref el efecto se re-ejecutaría todo el tiempo,
  // robando el foco y restaurándolo a cada rato.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return

    const panel = panelRef.current
    const previouslyFocused = document.activeElement as HTMLElement | null

    // Foco inicial: el que pida el componente (ej. el input de "CONFIRMAR"),
    // si no el primer elemento enfocable, si no el panel mismo.
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
        .filter(el => el.offsetParent !== null || el === document.activeElement)

    const timer = setTimeout(() => {
      const target = initialFocusRef?.current ?? focusables()[0] ?? panel
      target?.focus()
    }, 0)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== "Tab" || !panel) return

      const items = focusables()
      if (items.length === 0) {
        // Nada enfocable adentro: igual no dejamos que el Tab se escape.
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (!panel.contains(active)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      clearTimeout(timer)
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, initialFocusRef])

  return panelRef
}
