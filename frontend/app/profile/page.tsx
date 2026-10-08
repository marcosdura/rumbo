"use client"

import { useSession, signOut, getSession } from "next-auth/react"
import LoadingScreen from "@/components/ui/LoadingScreen"
import { useState, useEffect, useRef } from "react"
import Navbar from "@/components/layout/Navbar"
import { api, ApiError } from "@/lib/api"
import { EMPTY_SUMMARY, memberSince, menuRows, summaryLine, type ProfileSummary } from "@/lib/profile"
import ProfileInfoCard from "./ProfileInfoCard"
import ProfileMenu from "./ProfileMenu"
import AccountActions from "./AccountActions"
import DeleteAccountModal from "./DeleteAccountModal"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [summary, setSummary] = useState<ProfileSummary | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [deleting, setDeleting] = useState(false)
  const confirmInputRef = useRef<HTMLInputElement>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!session?.id_token) return

    // dataLoading arranca en true. Si el token se renueva, los datos se
    // recargan sin volver a mostrar la carga.
    let cancelled = false
    const fetchSummary = (idToken: string) => api.get<ProfileSummary>("/me/summary", { token: idToken })
    const is401 = (e: unknown) => e instanceof ApiError && e.status === 401

    fetchSummary(session.id_token)
      .catch(async (e) => {
        // Un 401 acá puede ser solo el id_token cruzando su expiración (~1h)
        // mientras el refresh silencioso de NextAuth todavía no corrió (el
        // poll de sesión es cada 5 min). Antes de desloguear, forzamos un
        // refresh de sesión y reintentamos una vez con el token fresco.
        if (!is401(e)) throw e
        const fresh = await getSession()
        if (fresh?.id_token && fresh.id_token !== session.id_token && !fresh.error) return fetchSummary(fresh.id_token)
        throw e
      })
      .then(({ data }) => { if (!cancelled) setSummary(data) })
      .catch((e) => {
        if (cancelled) return
        if (is401(e)) signOut({ redirect: false })
        // Otro error: el perfil se muestra igual, sin los números.
      })
      .finally(() => { if (!cancelled) setDataLoading(false) })

    return () => { cancelled = true }
  }, [session?.id_token, session?.error])

  const showLoading = status === "loading" || (!!session?.id_token && dataLoading)
  if (showLoading) return <LoadingScreen />

  if (!session) return null

  const { user } = session

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
    // El foco inicial lo pone useModalA11y dentro del modal.
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`

        .action-link:hover { background: #f7f5f0 !important; }
        .action-btn-danger:hover { background: #fdf0f0 !important; }

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
          font-family: var(--font-dm-sans), sans-serif;
        }
        .delete-confirm-input {
          width: 100%; box-sizing: border-box;
          padding: 10px 14px; border-radius: 10px;
          font-family: var(--font-dm-sans), sans-serif; font-size: 14px;
          outline: none; background: #fff;
          transition: border-color 0.15s;
        }
        .delete-confirm-input:focus { border-color: var(--danger); }
        .delete-btn-confirm {
          padding: 11px 20px; border-radius: 12px; border: none;
          font-family: var(--font-dm-sans), sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: background 0.15s, opacity 0.15s;
        }
        .delete-btn-confirm:disabled { cursor: not-allowed; }
        .delete-btn-cancel {
          padding: 11px 20px; border-radius: 12px;
          border: 1px solid var(--border); background: #fff;
          font-family: var(--font-dm-sans), sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; color: #3d3d3a;
          transition: background 0.15s;
        }
        .delete-btn-cancel:hover { background: #f7f5f0; }

        .profile-wrapper { max-width: 768px; width: 100%; margin: 0 auto; padding: 40px 24px 64px; box-sizing: border-box; }
        .profile-title   { font-family: var(--font-playfair-display), serif; font-size: 36px; font-weight: 600; color: #1b1b19; margin: 0; line-height: 1.2; }
        @media (max-width: 768px) {
          .profile-wrapper { padding: 24px 16px 48px; }
          .profile-title   { font-size: 26px; }
        }
      `}</style>

      <Navbar />

      <div className="profile-wrapper">
        {/* Header, como el de Mis reviews y Favoritos */}
        <div className="fade-up fade-up-1" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
              Tu cuenta
            </p>
          </div>
          <h1 className="profile-title">Perfil</h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ProfileInfoCard
            userName={user?.name} userEmail={user?.email} userImage={user?.image}
            memberSince={memberSince(summary?.member_since ?? null)}
            summary={summary ? summaryLine(summary) : null}
          />
          <ProfileMenu rows={menuRows(summary ?? EMPTY_SUMMARY)} />
          <AccountActions onDeleteRequest={openDeleteModal} />
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
