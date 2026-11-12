// Las guías del blog que guardó quien tiene sesión ("Guardar esta guía").
// Aparte de los favoritos de lugares (favoritesStore): son otra lista, en
// otra sección de /favorites. Guardar y sacar son optimistas: se ven al
// instante y se revierten si el backend falla.
import { create } from "zustand"
import { trackEvent } from "@/lib/analytics"
import { api } from "@/lib/api"
import type { BlogSummary } from "@/lib/blog"

export type SavedGuidesState = {
  guides: BlogSummary[]
  // Para qué token se cargó: con otra sesión se vuelve a pedir.
  loadedFor: string | null
  loading: boolean
  load: (token: string) => Promise<void>
  save: (post: BlogSummary, token: string) => Promise<boolean>
  unsave: (slug: string, token: string) => Promise<boolean>
  isSaved: (slug: string) => boolean
}

const path = (slug: string) => `/blog/posts/${encodeURIComponent(slug)}/save`

export const useSavedGuidesStore = create<SavedGuidesState>((set, get) => ({
  guides: [],
  loadedFor: null,
  loading: false,

  load: async (token) => {
    set({ loading: true })
    try {
      const { data } = await api.get<BlogSummary[]>("/blog/saved", { token })
      set({ guides: Array.isArray(data) ? data : [], loadedFor: token, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  save: async (post, token) => {
    const prev = get().guides
    if (!prev.some(g => g.slug === post.slug)) set({ guides: [post, ...prev] })
    try {
      await api.post(path(post.slug), undefined, { token })
      trackEvent("blog_save", { slug: post.slug })
      return true
    } catch {
      set({ guides: prev })
      return false
    }
  },

  unsave: async (slug, token) => {
    const prev = get().guides
    set({ guides: prev.filter(g => g.slug !== slug) })
    try {
      await api.del(path(slug), { token })
      return true
    } catch {
      set({ guides: prev })
      return false
    }
  },

  isSaved: (slug) => get().guides.some(g => g.slug === slug),
}))
