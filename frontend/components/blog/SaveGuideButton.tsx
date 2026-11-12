"use client"

// "Guardar esta guía": la nota va a la lista de guías guardadas (aparte de
// los favoritos de lugares), en /favorites. Sin sesión, pide entrar y la
// guarda al volver (lib/pendingAction, Providers.jsx).
import Link from "next/link"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import AuthModal from "@/components/layout/AuthModal"
import type { BlogSummary } from "@/lib/blog"
import { useSavedGuidesStore } from "@/store/savedGuidesStore"

export default function SaveGuideButton({ post }: { post: BlogSummary }) {
  const { data: session } = useSession()
  const token = session?.id_token
  const { loadedFor, load, save, unsave } = useSavedGuidesStore()
  const saved = useSavedGuidesStore(s => s.guides.some(g => g.slug === post.slug))
  const [showAuth, setShowAuth] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  // Las guardadas se piden una vez por sesión (las comparten los dos botones
  // de la nota y /favorites).
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

  return (
    <>
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} reason="guardar esta guía" pending={{ kind: "guide", slug: post.slug }} />
      )}
      <button
        type="button"
        className={`blog-chip-btn blog-save-guide${saved ? " is-saved" : ""}`}
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
      >
        {saved ? "🔖 Guardada" : "🔖 Guardar guía"}
      </button>
      {saved && <Link href="/favorites#guias" className="blog-save-guide-link">Ver mis guías</Link>}
      {error && <span className="blog-save-guide-error" role="alert">No se pudo. Probá de nuevo.</span>}
    </>
  )
}
