"use client"

// Favoritos, con el mismo armazón que las otras páginas del menú del perfil.
// Las cards son las de la búsqueda tal cual (antes esta página les pisaba
// con !important el alto de la foto y los textos en el celular). Las guías
// del blog guardadas van aparte, en su propia sección (#guias).
import { useEffect } from "react"
import Link from "next/link"
import BlogCard from "@/components/blog/BlogCard"
import "@/components/blog/blog.css"
import SpotCard from "@/components/spots/SpotCard"
import ProfileSubpage from "@/app/profile/ProfileSubpage"
import { useFavoritesStore } from "@/store/favoritesStore"
import { useSavedGuidesStore } from "@/store/savedGuidesStore"

const sectionTitle = { fontSize: 17, fontWeight: 700, color: "#1b1b19", margin: "0 0 12px" } as const

function Favorites({ token }: { token: string }) {
  const favorites = useFavoritesStore(s => s.favorites)
  const loading = useFavoritesStore(s => s.loading)
  const loadFavorites = useFavoritesStore(s => s.loadFavorites)

  const guides = useSavedGuidesStore(s => s.guides)
  const guidesLoading = useSavedGuidesStore(s => s.loading)
  const loadGuides = useSavedGuidesStore(s => s.load)
  const unsave = useSavedGuidesStore(s => s.unsave)

  useEffect(() => { loadFavorites(token) }, [token, loadFavorites])
  useEffect(() => { loadGuides(token) }, [token, loadGuides])

  if ((loading || guidesLoading) && favorites.length === 0 && guides.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>Cargando...</p>
  }

  if (favorites.length === 0 && guides.length === 0) {
    return (
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 20, padding: "48px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 40, margin: "0 0 12px", opacity: 0.25 }}>❤️</p>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 20, fontWeight: 700, color: "#1b1b19", margin: "0 0 6px" }}>
          Todavía no tenés favoritos
        </p>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
          Guardá con ♡ los lugares que te gustan, y con 🔖 las guías del blog, para tenerlos a mano.
        </p>
        <Link href="/search" style={{ display: "inline-flex", padding: "10px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600, background: "var(--primary-dark)", color: "#fff", textDecoration: "none" }}>
          Explorar lugares →
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gap: 32 }}>
      <style>{`
        .favs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        @media (max-width: 640px) { .favs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } }
        .favs-guides { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
        .favs-guide { display: grid; gap: 6px; }
        .favs-guide-remove { justify-self: start; background: none; border: none; padding: 2px 0; cursor: pointer; font: inherit; font-size: 12px; color: var(--muted); text-decoration: underline; }
        @media (max-width: 640px) { .favs-guides { grid-template-columns: 1fr; } }
      `}</style>
      {favorites.length > 0 && (
        <section aria-labelledby="favs-lugares">
          {guides.length > 0 && <h2 id="favs-lugares" style={sectionTitle}>❤️ Lugares</h2>}
          <div className="favs-grid">
            {favorites.map(spot => <SpotCard key={spot.id} spot={spot} />)}
          </div>
        </section>
      )}
      {guides.length > 0 && (
        <section id="guias" aria-labelledby="favs-guias">
          <h2 id="favs-guias" style={sectionTitle}>🔖 Guías guardadas</h2>
          <div className="favs-guides">
            {guides.map(post => (
              <div key={post.slug} className="favs-guide">
                <BlogCard post={post} />
                <button type="button" className="favs-guide-remove" aria-label={`Quitar «${post.title}» de mis guías`} onClick={() => unsave(post.slug, token)}>
                  Quitar de mis guías
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default function FavoritesPage() {
  const count = useFavoritesStore(s => s.favorites.length) + useSavedGuidesStore(s => s.guides.length)
  return (
    <ProfileSubpage title="Favoritos" count={count}>
      {token => <Favorites token={token} />}
    </ProfileSubpage>
  )
}
