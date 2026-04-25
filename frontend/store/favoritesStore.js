// store/favoritesStore.js
// Instalá zustand si no lo tenés: npm install zustand

import { create } from "zustand"

const API = "http://localhost:8000"
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

// ─── Store ────────────────────────────────────────────────────────────────────
export const useFavoritesStore = create((set, get) => ({
  favorites: [],
  loading: false,
  error: null,

  // Llama al GET /favorites/{user_id} y guarda en cache
  loadFavorites: async (userId) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API}/favorites/${userId}`)
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
  addFavorite: async (spot, userId) => {
    const prev = get().favorites
    const next = [...prev, spot]
    set({ favorites: next })
    saveCache(next)

    try {
      const res = await fetch(`${API}/favorites/${spot.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Si ya existe en el servidor, recargamos en vez de revertir
      const retry = await fetch(`${API}/favorites/${spot.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      }).catch(() => null)

      if (retry?.status === 409) {
        // El spot ya era favorito, dejamos el estado optimista como está
      } else {
        set({ favorites: prev })
        saveCache(prev)
      }
    }
  },

  // Optimistic: quita del estado antes de confirmar con el servidor
  removeFavorite: async (spotId, userId) => {
    const prev = get().favorites
    const next = prev.filter((f) => f.id !== spotId)
    set({ favorites: next })
    saveCache(next)

    try {
      const res = await fetch(`${API}/favorites/${spotId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Revertir si falla
      set({ favorites: prev })
      saveCache(prev)
    }
  },

  isFavorite: (spotId) => get().favorites.some((f) => f.id === spotId),
}))