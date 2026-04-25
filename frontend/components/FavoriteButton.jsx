"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useFavoritesStore } from "@/store/favoritesStore"
import Toast from "@/components/Toast"
import { createPortal } from "react-dom"

export default function FavoriteButton({ spot, variant = "detail" }) {
  const { data: session } = useSession()
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore()
  const [showToast, setShowToast] = useState(false)

  const userId = session?.user?.id
  const active = isFavorite(spot.id)

  const toggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      setShowToast(true)
      return
    }

    if (active) {
      await removeFavorite(spot.id, userId)
    } else {
      await addFavorite(spot, userId)
    }
  }

  // ─── Variante "detail" ────────────────────────────────────────────────────
  if (variant === "detail") {
    return (
      <>
        {showToast && createPortal(
          <Toast
            message="Iniciá sesión para guardar favoritos"
            onClose={() => setShowToast(false)}
          />,
          document.body
        )}
        <style>{`
          .fav-btn-detail {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 12px;
            border: 1px solid rgba(0,0,0,0.1);
            background: rgba(255,255,255,0.8);
            font-size: 14px;
            font-family: 'DM Sans', sans-serif;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
            color: #374151;
          }
          .fav-btn-detail:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 14px rgba(0,0,0,0.1);
          }
          .fav-btn-detail.active {
            background: #fee2e2;
            border-color: #fca5a5;
            color: #dc2626;
          }
          .fav-heart {
            font-size: 15px;
            transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .fav-btn-detail:hover .fav-heart {
            transform: scale(1.2);
          }
        `}</style>
        <button
          onClick={toggle}
          className={`fav-btn-detail btn-action ${active ? "active" : ""}`}
          aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
        >
          <span className="fav-heart">{active ? "❤️" : "🖤"}</span>
          {active ? "Guardado" : "Guardar"}
        </button>
      </>
    )
  }

  // ─── Variante "card" ──────────────────────────────────────────────────────
  return (
    <>
      {showToast && createPortal(
        <Toast
          message="Iniciá sesión para guardar favoritos"
          onClose={() => setShowToast(false)}
        />,
        document.body
      )}
      <style>{`
        .fav-btn-card {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          color: #e11d48;
        }
        .fav-btn-card:hover {
          transform: scale(1.15);
          background: white;
          box-shadow: 0 4px 14px rgba(0,0,0,0.2);
        }
        .fav-btn-card.active {
          background: #fee2e2;
          border-color: #fca5a5;
        }
      `}</style>
      <button
        onClick={toggle}
        className={`fav-btn-card ${active ? "active" : ""}`}
        aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      >
        {active ? "❤️" : "🖤"}
      </button>
    </>
  )
}