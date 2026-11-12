"use client"

// "Guardar los N lugares": todos los lugares de Rumbo de una nota a
// favoritos, de una (POST /favorites/bulk). Sin sesión, pide entrar y los
// guarda al volver (lib/pendingAction, Providers.jsx).
import Link from "next/link"
import { useState } from "react"
import { useSession } from "next-auth/react"
import AuthModal from "@/components/layout/AuthModal"
import { trackEvent } from "@/lib/analytics"
import { api } from "@/lib/api"
import { useFavoritesStore } from "@/store/favoritesStore"

export default function SaveAllButton({ spotIds, slug }: { spotIds: number[]; slug: string }) {
  const { data: session } = useSession()
  const token = session?.id_token
  const { isFavorite, loadFavorites } = useFavoritesStore()
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle")
  const [showAuth, setShowAuth] = useState(false)

  if (spotIds.length === 0) return null
  const allSaved = token && spotIds.every(id => isFavorite(id))
  const n = spotIds.length
  const label = n === 1 ? "Guardar el lugar de Rumbo" : `Guardar los ${n} lugares de Rumbo`

  async function save() {
    if (!token) { setShowAuth(true); return }
    setState("saving")
    try {
      await api.post("/favorites/bulk", { spot_ids: spotIds }, { token })
      trackEvent("blog_save_all", { slug, count: n })
      await loadFavorites(token)
      setState("done")
    } catch {
      setState("error")
    }
  }

  if (state === "done" || allSaved) {
    return (
      <p className="blog-save-all is-done">
        ❤️ {n === 1 ? "Está" : "Están"} en tus favoritos · <Link href="/favorites">Ver favoritos</Link>
      </p>
    )
  }
  return (
    <>
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          reason={n === 1 ? "guardar este lugar en favoritos" : "guardar estos lugares en favoritos"}
          pending={{ kind: "favorites", spotIds }}
        />
      )}
      <button type="button" className="blog-chip-btn blog-save-all" onClick={save} disabled={state === "saving"}>
        {state === "saving" ? "Guardando…" : `❤️ ${label}`}
      </button>
      {state === "error" && <p className="blog-save-all-error" role="alert">No se pudo guardar. Probá de nuevo.</p>}
    </>
  )
}
