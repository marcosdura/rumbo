"use client"

// Favoritos, con el mismo armazón que las otras páginas del menú del perfil.
// Las cards son las de la búsqueda tal cual (antes esta página les pisaba
// con !important el alto de la foto y los textos en el celular).
import { useEffect } from "react"
import Link from "next/link"
import SpotCard from "@/components/spots/SpotCard"
import ProfileSubpage from "@/app/profile/ProfileSubpage"
import { useFavoritesStore } from "@/store/favoritesStore"
import type { SpotListItem } from "@/lib/types"

// SpotCard y el store son .js/.jsx.
const Card = SpotCard as unknown as (p: { spot: SpotListItem }) => React.ReactElement
type FavoritesState = { favorites: SpotListItem[]; loading: boolean; loadFavorites: (t: string) => Promise<void> }
const useFavorites = useFavoritesStore as unknown as <T>(selector: (s: FavoritesState) => T) => T

function Favorites({ token }: { token: string }) {
  const favorites = useFavorites(s => s.favorites)
  const loading = useFavorites(s => s.loading)
  const loadFavorites = useFavorites(s => s.loadFavorites)

  useEffect(() => { loadFavorites(token) }, [token, loadFavorites])

  if (loading && favorites.length === 0) return <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>Cargando...</p>

  if (favorites.length === 0) {
    return (
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 20, padding: "48px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 40, margin: "0 0 12px", opacity: 0.25 }}>❤️</p>
        <p style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 20, fontWeight: 600, color: "#1b1b19", margin: "0 0 6px" }}>
          Todavía no tenés favoritos
        </p>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
          Guardá con ♡ los lugares que te gustan para tenerlos a mano.
        </p>
        <Link href="/search" style={{ display: "inline-flex", padding: "10px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600, background: "var(--primary-dark)", color: "#fff", textDecoration: "none" }}>
          Explorar lugares →
        </Link>
      </div>
    )
  }

  return (
    <div className="favs-grid">
      <style>{`
        .favs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        @media (max-width: 640px) { .favs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } }
      `}</style>
      {favorites.map(spot => <Card key={spot.id} spot={spot} />)}
    </div>
  )
}

export default function FavoritesPage() {
  const count = useFavorites(s => s.favorites.length)
  return (
    <ProfileSubpage title="Favoritos" count={count}>
      {token => <Favorites token={token} />}
    </ProfileSubpage>
  )
}
