"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import Pill from "@/components/ui/Pill"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { tab } from "@/lib/theme"
import { api, ApiError } from "@/lib/api"
import type { AdminSpot, AdminMode, SortBy } from "./types"
import SpotsTab from "./SpotsTab"
import PhotosTab from "./PhotosTab"
import DeactivatedTab from "./DeactivatedTab"
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
  const [photoToDelete, setPhotoToDelete] = useState<{ spotId: number; publicId: string } | null>(null)
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
    setActionLoading(id)
    await api.del(`/spots/${id}`, { token }).catch(() => {})
    setSpots(prev => prev.filter(s => s.id !== id))
    setActionLoading(null)
    setDeleteConfirmId(null)
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
    setPhotoLoading(true)
    await api.del(`/admin/images/${encodeURIComponent(publicId)}`, { token }).catch(() => {})
    setSpots(prev => prev.map(s => {
      if (s.id !== spotId) return s
      return { ...s, images: s.images.filter(img => img.cloudinary_public_id !== publicId) }
    }))
    setPhotoLoading(false)
    setPhotoToDelete(null)
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
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`
        .spot-row { background: #fff; border: 1px solid var(--border); border-radius: 20px; box-shadow: var(--shadow-card); padding: 14px 18px; display: flex; align-items: center; gap: 14px; }
        .action-btn-sm { padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.15s; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
            ← Volver al inicio
          </Link>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 26, fontWeight: 600, color: "#1b1b19", margin: "0 0 6px" }}>
                Panel de administración
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Pill variant="dark-green" size="sm">modo admin</Pill>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {activeSpots.length} spot{activeSpots.length !== 1 ? "s" : ""}
                  {pending > 0 ? ` · ${pending} pendiente${pending !== 1 ? "s" : ""}` : ""}
                </span>
              </div>
            </div>
            <a href="/agregar-lugar"
              style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "1px solid var(--border)", background: "#fff", color: "#3d3d3a", textDecoration: "none" }}>
              + Agregar lugar
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {([
            { id: "spots", label: `🗺️ Gestión de spots${pending > 0 ? ` (${pending})` : ""}` },
            { id: "fotos", label: "📷 Gestión de fotos" },
            { id: "cuentas-eliminadas", label: `👤 Cuentas eliminadas${deactivatedSpots.length > 0 ? ` (${deactivatedSpots.length})` : ""}` },
          ] as { id: AdminMode; label: string }[]).map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={tab(mode === m.id)}>
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
            onDeleteRequest={setDeleteConfirmId}
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
            onDeletePhotoRequest={(spotId, publicId) => setPhotoToDelete({ spotId, publicId })}
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
            onDeleteRequest={setDeleteConfirmId}
          />
        )}
      </div>

      <ConfirmModal
        open={deleteConfirmId !== null}
        title="¿Eliminar este spot?"
        message="Esta acción no se puede deshacer."
        confirmPhrase="CONFIRMAR"
        loading={actionLoading === deleteConfirmId}
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId !== null && handleDelete(deleteConfirmId)}
      />

      <ConfirmModal
        open={photoToDelete !== null}
        title="¿Eliminar esta foto?"
        message="La foto se borra de Cloudinary y no se puede recuperar."
        loading={photoLoading}
        onCancel={() => setPhotoToDelete(null)}
        onConfirm={() => photoToDelete && handleDeletePhoto(photoToDelete.spotId, photoToDelete.publicId)}
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
