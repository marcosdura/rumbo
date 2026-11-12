"use client"

// "Guardar guía": la nota va a la lista de guías guardadas (aparte de los
// favoritos de lugares), en /favorites. Se ve como "Guardar" en la página de
// un lugar (FavoriteButton), al lado de "Compartir". Sin sesión, pide entrar
// y la guarda al volver (lib/pendingAction, Providers.jsx).
// icon: solo el ícono (la barra de arriba en el celular).
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import AuthModal from "@/components/layout/AuthModal"
import type { BlogSummary } from "@/lib/blog"
import { useSavedGuidesStore } from "@/store/savedGuidesStore"

export default function SaveGuideButton({ post, icon = false }: { post: BlogSummary; icon?: boolean }) {
  const { data: session } = useSession()
  const token = session?.id_token
  const { loadedFor, load, save, unsave } = useSavedGuidesStore()
  const saved = useSavedGuidesStore(s => s.guides.some(g => g.slug === post.slug))
  const [showAuth, setShowAuth] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  // Las guardadas se piden una vez por sesión (las comparten los botones de
  // la nota y /favorites).
  useEffect(() => {
    if (token && loadedFor !== token) load(token)
  }, [token, loadedFor, load])

  async function toggle() {
    if (!token) { setShowAuth(true); return }
    setBusy(true)
    setError(false)
    const ok = saved ? await unsave(post.slug, token) : await save(post, token)
    setError(!ok)
    setBusy(false)
  }

  const label = saved ? "Guardada" : "Guardar"
  return (
    <>
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} reason="guardar esta guía" pending={{ kind: "guide", slug: post.slug }} />
      )}
      <button
        type="button"
        className={`blog-save-guide${saved ? " is-saved" : ""}${icon ? " is-icon" : ""}`}
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        aria-label={icon ? (saved ? "Guía guardada" : "Guardar guía") : undefined}
        title={error ? "No se pudo. Probá de nuevo." : undefined}
      >
        <span aria-hidden="true">🔖</span>
        {!icon && label}
      </button>
    </>
  )
}
