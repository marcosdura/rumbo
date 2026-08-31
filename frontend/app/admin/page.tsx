"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { api, ApiError } from "@/lib/api"
import type { AdminSpot, AdminMode, SortBy } from "./types"
import SpotsTab from "./SpotsTab"
import PhotosTab from "./PhotosTab"
import DeactivatedTab from "./DeactivatedTab"
import DeleteConfirmModal from "./DeleteConfirmModal"
import EditSpotModal from "./EditSpotModal"

export default function AdminPage() {
  const { data: session } = useSession()
  const token = session?.id_token
  const [mode, setMode] = useState<AdminMode>("spots")
  const [spots, setSpots] = useState<AdminSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending")
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [photoSpotId, setPhotoSpotId] = useState<number | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [searchSpots, setSearchSpots] = useState("")
  const [searchPhotos, setSearchPhotos] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("date_desc")
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [editingSpot, setEditingSpot] = useState<{ id: number; name: string; description: string } | null>(null)

  useEffect(() => {
    if (!token) return
    setLoadError(null)
    api.get<AdminSpot[]>("/admin/spots", { token })
      .then(({ data }) => { setSpots(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(e => {
        setLoadError(e instanceof ApiError && e.status === 403
          ? "No tenés permisos de administrador con esta cuenta."
          : "Error al cargar los spots.")
        setLoading(false)
      })
  }, [token])

  async function handleApprove(id: number, approved: boolean) {
    setActionLoading(id)
    await api.patch(`/admin/spots/${id}/approve`, undefined, { token, params: { approved } }).catch(() => {})
    setSpots(prev => prev.map(s => s.id === id ? { ...s, is_approved: approved } : s))
    setActionLoading(null)
  }

  async function handleDelete(id: number) {
    if (deleteConfirmText !== "CONFIRMAR") return
    setActionLoading(id)
    await api.del(`/spots/${id}`, { token }).catch(() => {})
    setSpots(prev => prev.filter(s => s.id !== id))
    setActionLoading(null)
    setDeleteConfirmId(null)
    setDeleteConfirmText("")
  }

  async function handleReactivate(id: number) {
    setActionLoading(id)
    await api.patch(`/admin/spots/${id}/reactivate`, undefined, { token }).catch(() => {})
    setSpots(prev => prev.map(s => s.id === id ? { ...s, owner_deleted_at: null } : s))
    setActionLoading(null)
  }

  async function handleSetMainPhoto(spotId: number, publicId: string) {
    setPhotoLoading(true)
    await api.patch(`/admin/spots/${spotId}/main-image`, { cloudinary_public_id: publicId }, { token }).catch(() => {})
    setSpots(prev => prev.map(s => {
      if (s.id !== spotId) return s
      return {
        ...s,
        images: s.images.map(img => ({ ...img, is_main: img.cloudinary_public_id === publicId })),
      }
    }))
    setPhotoLoading(false)
  }

  async function handleDeletePhoto(spotId: number, publicId: string) {
    if (!confirm("¿Eliminar esta foto?")) return
    setPhotoLoading(true)
    await api.del(`/admin/images/${encodeURIComponent(publicId)}`, { token }).catch(() => {})
    setSpots(prev => prev.map(s => {
      if (s.id !== spotId) return s
      return { ...s, images: s.images.filter(img => img.cloudinary_public_id !== publicId) }
    }))
    setPhotoLoading(false)
  }

  async function handleSaveEdit() {
    if (!editingSpot) return
    await api.patch(`/admin/spots/${editingSpot.id}`, { name: editingSpot.name, description: editingSpot.description }, { token }).catch(() => {})
    setSpots(prev => prev.map(s => s.id === editingSpot.id ? { ...s, name: editingSpot.name } : s))
    setEditingSpot(null)
  }

  // Los spots cuyo dueño borró la cuenta se dejan de mostrar en la gestión
  // normal — viven aparte, en la pestaña "Cuentas eliminadas".
  const activeSpots = spots.filter(s => !s.owner_deleted_at)
  const deactivatedSpots = spots
    .filter(s => s.owner_deleted_at)
    .sort((a, b) => new Date(a.owner_deleted_at!).getTime() - new Date(b.owner_deleted_at!).getTime())

  const pending = activeSpots.filter(s => !s.is_approved).length
  const filtered = activeSpots.filter(s =>
    filter === "all" ? true : filter === "pending" ? !s.is_approved : s.is_approved
  )
  const displayed = filtered
    .filter(s =>
      s.name.toLowerCase().includes(searchSpots.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchSpots.toLowerCase()) ||
      s.category?.name?.toLowerCase().includes(searchSpots.toLowerCase()) ||
      s.owner_email?.toLowerCase().includes(searchSpots.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "category") return (a.category?.name ?? "").localeCompare(b.category?.name ?? "")
      if (sortBy === "department") return (a.department ?? "").localeCompare(b.department ?? "")
      if (sortBy === "date_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === "date_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return 0
    })

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .admin-nav { background: linear-gradient(160deg, var(--primary-dark) 0%, var(--primary) 65%, #40916c 100%); padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
        .admin-pill { padding: 7px 18px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.25); background: rgba(255,255,255,0.12); color: #fff; }
        .admin-pill.active { background: #fff; color: var(--primary-dark); border-color: #fff; }
        .admin-pill:not(.active):hover { background: rgba(255,255,255,0.22); }
        .spot-row { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 14px 18px; display: flex; align-items: center; gap: 14px; }
        .action-btn-sm { padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.15s; }
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-top: 16px; }
        .photo-card { border-radius: 12px; overflow: hidden; border: 1px solid var(--border); position: relative; background: #f0ede8; }
        .photo-card img { width: 100%; height: 100px; object-fit: cover; display: block; }
      `}</style>

      <nav className="admin-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/RumboLogo.png" alt="Rumbo" width={32} height={32} style={{ objectFit: "contain", borderRadius: 8 }} />
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>rumbo</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginLeft: 8, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>modo admin</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href="/agregar-lugar" style={{ padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, color: "#fff", border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.12)", textDecoration: "none" }}>
            + Agregar lugar
          </a>
          <a href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>← Volver</a>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px" }}>

        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {([
            { id: "spots", label: `🗺️ Gestión de spots${pending > 0 ? ` (${pending})` : ""}` },
            { id: "fotos", label: "📷 Gestión de fotos" },
            { id: "cuentas-eliminadas", label: `👤 Cuentas eliminadas${deactivatedSpots.length > 0 ? ` (${deactivatedSpots.length})` : ""}` },
          ] as { id: AdminMode; label: string }[]).map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`admin-pill${mode === m.id ? " active" : ""}`}
              style={{ background: mode === m.id ? "var(--primary-dark)" : "#fff", color: mode === m.id ? "#fff" : "#3d3d3a", border: `1px solid ${mode === m.id ? "var(--primary-dark)" : "var(--border)"}` }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "spots" && (
          <SpotsTab
            displayed={displayed}
            pending={pending}
            filter={filter}
            setFilter={setFilter}
            searchSpots={searchSpots}
            setSearchSpots={setSearchSpots}
            sortBy={sortBy}
            setSortBy={setSortBy}
            loadError={loadError}
            loading={loading}
            actionLoading={actionLoading}
            onApprove={handleApprove}
            onEdit={setEditingSpot}
            onDeleteRequest={(id) => { setDeleteConfirmId(id); setDeleteConfirmText("") }}
          />
        )}

        {mode === "fotos" && (
          <PhotosTab
            spots={spots}
            token={token}
            searchPhotos={searchPhotos}
            setSearchPhotos={setSearchPhotos}
            photoSpotId={photoSpotId}
            setPhotoSpotId={setPhotoSpotId}
            photoLoading={photoLoading}
            onSetMainPhoto={handleSetMainPhoto}
            onDeletePhoto={handleDeletePhoto}
            onSpotsRefreshed={setSpots}
          />
        )}

        {mode === "cuentas-eliminadas" && (
          <DeactivatedTab
            deactivatedSpots={deactivatedSpots}
            loadError={loadError}
            loading={loading}
            actionLoading={actionLoading}
            onReactivate={handleReactivate}
            onDeleteRequest={(id) => { setDeleteConfirmId(id); setDeleteConfirmText("") }}
          />
        )}
      </div>

      <DeleteConfirmModal
        open={deleteConfirmId !== null}
        confirmText={deleteConfirmText}
        setConfirmText={setDeleteConfirmText}
        loading={actionLoading === deleteConfirmId}
        onCancel={() => { setDeleteConfirmId(null); setDeleteConfirmText("") }}
        onConfirm={() => deleteConfirmId !== null && handleDelete(deleteConfirmId)}
      />

      <EditSpotModal
        editingSpot={editingSpot}
        setEditingSpot={setEditingSpot}
        onCancel={() => setEditingSpot(null)}
        onSave={handleSaveEdit}
      />
    </div>
  )
}
