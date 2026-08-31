"use client"

import { useSession, signOut, getSession } from "next-auth/react"
import LoadingScreen from "@/components/ui/LoadingScreen"
import { useState, useEffect, useRef } from "react"
import Navbar from "@/components/layout/Navbar"
import { api, ApiError } from "@/lib/api"
import ProfileInfoCard from "./ProfileInfoCard"
import AccountActions from "./AccountActions"
import StatsRow from "./StatsRow"
import MySpotsCard from "./MySpotsCard"
import FavoritesPreview from "./FavoritesPreview"
import DeleteAccountModal from "./DeleteAccountModal"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [favorites, setFavorites] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [mySpots, setMySpots] = useState<any[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [deleting, setDeleting] = useState(false)
  const confirmInputRef = useRef<HTMLInputElement>(null)
  const [dataLoading, setDataLoading] = useState(true)

 useEffect(() => {
  if (!session?.id_token) return

  setDataLoading(true)
  let cancelled = false

  const fetchAll = (idToken: string) => {
    return Promise.allSettled([
      api.get<any[]>("/favorites", { token: idToken }),
      api.get<any[]>("/reviews/user/me", { token: idToken }),
      api.get<any[]>("/spots/mine", { token: idToken }),
    ])
  }

  const is401 = (r: PromiseSettledResult<{ data: any[] }>) =>
    r.status === "rejected" && r.reason instanceof ApiError && r.reason.status === 401
  const toData = (r: PromiseSettledResult<{ data: any[] }>) =>
    r.status === "fulfilled" && Array.isArray(r.value.data) ? r.value.data : []

  fetchAll(session.id_token)
    .then(async (results) => {
      // Un 401 acá puede ser solo el id_token cruzando su expiración (~1h)
      // mientras el refresh silencioso de NextAuth todavía no corrió (el
      // poll de sesión es cada 5 min). Antes de desloguear, forzamos un
      // refresh de sesión y reintentamos una vez con el token fresco.
      if (results.some(is401)) {
        const fresh = await getSession()
        if (fresh?.id_token && fresh.id_token !== session.id_token && !fresh.error) {
          results = await fetchAll(fresh.id_token)
        }
      }
      if (cancelled) return
      if (results.some(is401)) {
        signOut({ redirect: false })
        return
      }
      const [favData, reviewData, spotsData] = results.map(toData)
      setFavorites(favData)
      setReviews(reviewData)
      setMySpots(spotsData)
    })
    .finally(() => { if (!cancelled) setDataLoading(false) })

  return () => { cancelled = true }
}, [session?.id_token, session?.error])

  const showLoading = status === "loading" || (!!session?.id_token && dataLoading)
  if (showLoading) return <LoadingScreen />

  if (!session) return null

  const { user } = session
  const joinDate = new Date().toLocaleDateString("es-UY", { month: "long", year: "numeric" })

  async function handleDeleteAccount() {
    if (confirmText !== "CONFIRMAR") return
    setDeleting(true)
    setDeleteError("")
    try {
      await api.del("/users/me", { token: session?.id_token })
      await signOut({ callbackUrl: "/?cuenta=eliminada" })
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : "Error de red. Intentá de nuevo.")
      setDeleting(false)
    }
  }

  function openDeleteModal() {
    setConfirmText("")
    setDeleteError("")
    setShowDeleteModal(true)
    setTimeout(() => confirmInputRef.current?.focus(), 50)
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .action-link:hover { background: #f7f5f0 !important; }
        .action-btn-danger:hover { background: #fdf0f0 !important; }
        .fav-thumb:hover { transform: scale(1.03); }
        .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09) !important; transform: translateY(-2px); }

        .delete-modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .delete-modal {
          background: #f5f4f0; border: 1px solid var(--border); border-radius: 20px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.18);
          padding: 28px; width: 100%; max-width: 440px;
          font-family: 'DM Sans', sans-serif;
        }
        .delete-confirm-input {
          width: 100%; box-sizing: border-box;
          padding: 10px 14px; border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 14px;
          outline: none; background: #fff;
          transition: border-color 0.15s;
        }
        .delete-confirm-input:focus { border-color: var(--danger); }
        .delete-btn-confirm {
          padding: 11px 20px; border-radius: 12px; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: background 0.15s, opacity 0.15s;
        }
        .delete-btn-confirm:disabled { cursor: not-allowed; }
        .delete-btn-cancel {
          padding: 11px 20px; border-radius: 12px;
          border: 1px solid var(--border); background: #fff;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; color: #3d3d3a;
          transition: background 0.15s;
        }
        .delete-btn-cancel:hover { background: #f7f5f0; }

        .profile-scroll {
          flex: 1; overflow-y: auto; margin-top: 40px; padding-bottom: 40px;
        }
        .profile-wrapper {
          max-width: 1000px; width: 100%; margin: 0 auto; padding: 0 24px;
        }
        .profile-grid {
          display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start;
        }
        .profile-favs-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
        }

        @media (max-width: 768px) {
          .profile-scroll  { margin-top: 24px; }
          .profile-wrapper { padding: 0 16px; }
          .profile-grid    { grid-template-columns: 1fr; }
          .profile-favs-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <Navbar />

      <div className="profile-scroll" style={{ display: "flex", flexDirection: "column" }}>
        <div className="profile-wrapper">
        {/* Header */}
         <div className="fade-up fade-up-1" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
              Tu cuenta
            </p>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 600, color: "#1b1b19", margin: 0, lineHeight: 1.2 }}>
            Perfil
          </h1>
        </div>

        <div className="profile-grid">

          {/* ── Columna izquierda ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ProfileInfoCard userName={user?.name} userEmail={user?.email} userImage={user?.image} joinDate={joinDate} />
            <AccountActions onDeleteRequest={openDeleteModal} />
          </div>

          {/* ── Columna derecha ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <StatsRow reviewsCount={reviews.length} favoritesCount={favorites.length} />
            <MySpotsCard mySpots={mySpots} />
            <FavoritesPreview favorites={favorites} />
          </div>
        </div>
      </div>
      </div>

      <DeleteAccountModal
        open={showDeleteModal}
        confirmText={confirmText}
        setConfirmText={setConfirmText}
        deleteError={deleteError}
        deleting={deleting}
        inputRef={confirmInputRef}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  )
}
