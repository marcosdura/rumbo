// Los favoritos de quien tiene sesión, con una copia en localStorage por si
// el servidor no responde. Agregar y quitar son optimistas: se ven al
// instante y se revierten si el backend falla.
import { create } from "zustand"
import { signOut, getSession } from "next-auth/react"
import { trackEvent } from "@/lib/analytics"
import { api, ApiError } from "@/lib/api"
import type { SpotListItem } from "@/lib/types"

export type FavoritesState = {
  favorites: SpotListItem[]
  loading: boolean
  error: string | null
  loadFavorites: (token: string) => Promise<void>
  addFavorite: (spot: SpotListItem, token: string) => Promise<void>
  removeFavorite: (spotId: number, token: string) => Promise<void>
  isFavorite: (spotId: number) => boolean
}

const CACHE_KEY = "rumbo_favorites"

// ─── Helpers localStorage ─────────────────────────────────────────────────────
const saveCache = (favorites: SpotListItem[]) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(favorites)) } catch {}
}

const readCache = (): SpotListItem[] => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

// Un 401 acá puede ser solo el id_token cruzando su expiración (~1h) mientras
// el refresh silencioso de NextAuth todavía no corrió (el poll de sesión es
// cada 5 min). Antes de desloguear, forzamos un refresh de sesión y
// reintentamos una vez con el token fresco.
const requestWithRefresh = async (method: "post" | "del", path: string, token: string) => {
  const call = (t: string) => (method === "post" ? api.post(path, undefined, { token: t }) : api.del(path, { token: t }))
  try {
    return await call(token)
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      const fresh = await getSession()
      if (fresh?.id_token && fresh.id_token !== token && !fresh.error) {
        return await call(fresh.id_token)
      }
    }
    throw e
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  loading: false,
  error: null,

  // Llama al GET /favorites y guarda en cache
  loadFavorites: async (token) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get<SpotListItem[]>("/favorites", { token })
      saveCache(data)
      set({ favorites: data, loading: false })
    } catch (err) {
      // Si falla el servidor, usa el cache local
      set({ favorites: readCache(), loading: false, error: err instanceof Error ? err.message : "Error" })
    }
  },

  // Optimistic: agrega al estado antes de confirmar con el servidor
  addFavorite: async (spot, token) => {
    const prev = get().favorites
    const next = [...prev, spot]
    set({ favorites: next })
    saveCache(next)

    try {
      await requestWithRefresh("post", `/favorites/${spot.id}`, token)
      trackEvent("favorite_add", { spot_id: spot.id })
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        set({ favorites: prev })
        saveCache(prev)
        signOut({ redirect: false })
        return
      }
      if (e instanceof ApiError && e.status === 409) {
        // ya era favorito — se trata como éxito, no se revierte
        trackEvent("favorite_add", { spot_id: spot.id })
        return
      }
      set({ favorites: prev })
      saveCache(prev)
    }
  },

  // Optimistic: quita del estado antes de confirmar con el servidor
  removeFavorite: async (spotId, token) => {
    const prev = get().favorites
    const next = prev.filter((f) => f.id !== spotId)
    set({ favorites: next })
    saveCache(next)

    try {
      await requestWithRefresh("del", `/favorites/${spotId}`, token)
      trackEvent("favorite_remove", { spot_id: spotId })
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        set({ favorites: prev })
        saveCache(prev)
        signOut({ redirect: false })
        return
      }
      // Revertir si falla
      set({ favorites: prev })
      saveCache(prev)
    }
  },

  isFavorite: (spotId) => get().favorites.some((f) => f.id === spotId),
}))