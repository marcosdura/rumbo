// store/favoritesStore.js
// Instalá zustand si no lo tenés: npm install zustand

import { create } from "zustand"
import { signOut, getSession } from "next-auth/react"
import { trackEvent } from "@/lib/analytics"

const API = process.env.NEXT_PUBLIC_API_URL
const CACHE_KEY = "rumbo_favorites"

// ─── Helpers localStorage ─────────────────────────────────────────────────────
const saveCache = (favorites) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(favorites)) } catch {}
}

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

// Un 401 acá puede ser solo el id_token cruzando su expiración (~1h) mientras
// el refresh silencioso de NextAuth todavía no corrió (el poll de sesión es
// cada 5 min). Antes de desloguear, forzamos un refresh de sesión y
// reintentamos una vez con el token fresco.
const fetchWithRefresh = async (url, method, token) => {
  const req = (t) => fetch(url, { method, headers: { Authorization: `Bearer ${t}` } })
  let res = await req(token)
  if (res.status === 401) {
    const fresh = await getSession()
    if (fresh?.id_token && fresh.id_token !== token && !fresh.error) {
      res = await req(fresh.id_token)
    }
  }
  return res
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useFavoritesStore = create((set, get) => ({
  favorites: [],
  loading: false,
  error: null,

  // Llama al GET /favorites y guarda en cache
  loadFavorites: async (token) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Error al cargar favoritos")
      const data = await res.json()
      saveCache(data)
      set({ favorites: data, loading: false })
    } catch (err) {
      // Si falla el servidor, usa el cache local
      set({ favorites: readCache(), loading: false, error: err.message })
    }
  },

  // Optimistic: agrega al estado antes de confirmar con el servidor
  addFavorite: async (spot, token) => {
    const prev = get().favorites
    const next = [...prev, spot]
    set({ favorites: next })
    saveCache(next)

    try {
      const res = await fetchWithRefresh(`${API}/favorites/${spot.id}`, "POST", token)
      if (res.status === 401) {
        set({ favorites: prev })
        saveCache(prev)
        signOut({ redirect: false })
        return
      }
      if (!res.ok && res.status !== 409) throw new Error()
      trackEvent("favorite_add", { spot_id: spot.id })
    } catch {
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
      const res = await fetchWithRefresh(`${API}/favorites/${spotId}`, "DELETE", token)
      if (res.status === 401) {
        set({ favorites: prev })
        saveCache(prev)
        signOut({ redirect: false })
        return
      }
      if (!res.ok) throw new Error()
      trackEvent("favorite_remove", { spot_id: spotId })
    } catch {
      // Revertir si falla
      set({ favorites: prev })
      saveCache(prev)
    }
  },

  isFavorite: (spotId) => get().favorites.some((f) => f.id === spotId),
}))