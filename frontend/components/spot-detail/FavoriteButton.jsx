"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useFavoritesStore } from "@/store/favoritesStore"
import AuthModal from "@/components/layout/AuthModal"

export default function FavoriteButton({ spot, variant = "detail" }) {
  const { data: session } = useSession()
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore()
  const [showAuth, setShowAuth] = useState(false)

  const token = session?.id_token
  const active = isFavorite(spot.id)

  const toggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!token) { setShowAuth(true); return }
    if (active) await removeFavorite(spot.id, token)
    else        await addFavorite(spot, token)
  }

  // variante en los detalles del spot
  if (variant === "detail") {
    return (
      <>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        <style>{`
          .fav-btn-detail {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 9px 16px;
            border-radius: 12px;
            font-size: 13px;
            font-family: var(--font-dm-sans), sans-serif;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
            border: 1px solid var(--border);
            background: #fff;
            color: #3d3d3a;
          }
          .fav-btn-detail:hover {
            background: #f7f5f0;
            transform: translateY(-1px);
          }
          .fav-btn-detail.active {
            background: #ffcccc;
            border-color: #f78080;
            color: var(--danger);
          }
          .fav-btn-detail.active:hover {
            background: #fce8e8;
          }
          .fav-heart {
            font-size: 14px;
            transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .fav-btn-detail:hover .fav-heart { transform: scale(1.2); }
        `}</style>

        <button
          onClick={toggle}
          className={`fav-btn-detail ${active ? "active" : ""}`}
          aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
        >
          <span className="fav-heart">{active ? "❤️" : <span style={{ opacity: 0.25 }}>❤️</span>}
          </span>
          {active ? "Guardado" : "Guardar"}
        </button>
      </>
    )
  }

  // variante sobre la card
  return (
    <>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <style>{`
        .fav-btn-card {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid var(--border);

          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);

          background: rgba(255,255,255,0.95);
          box-shadow: 0 1px 6px rgba(0,0,0,0.18);
        }
        .fav-btn-card:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          background: #f7f5f0;
        }
        .fav-btn-card.active {
          background: #ffcccc;
          border-color: #f78080;
        }
        .fav-btn-card.active:hover {
          background: #fce8e8;
        }
      `}</style>

      <button
        onClick={toggle}
        className={`fav-btn-card ${active ? "active" : ""}`}
        aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      >
        {active ? "❤️" : <span style={{ opacity: 0.25 }}>❤️</span>}

      </button>
    </>
  )
}