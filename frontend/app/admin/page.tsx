"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import Pill from "@/components/ui/Pill"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { tab } from "@/lib/theme"
import { api, ApiError } from "@/lib/api"
import { label as labelStyle, input as inputStyle } from "@/lib/theme"
import { spotStatus, type AdminSpot, type AdminMode, type SortBy, type AdminChangeRequest, type SpotFilter } from "./types"
import SpotsTab from "./SpotsTab"
import PhotosTab from "./PhotosTab"
import DeactivatedTab from "./DeactivatedTab"
import ChangesTab from "./ChangesTab"
import ContributionsList from "./ContributionsList"
import OperatorChangesList, { type AdminOperatorChange } from "./OperatorChangesList"
import ReportsTab, { groupKey, type ReportGroup } from "./ReportsTab"
import type { AdminContribution } from "@/lib/contributions"
import EditSpotModal from "./EditSpotModal"

export default function AdminPage() {
  const { data: session } = useSession()
  const token = session?.id_token
  const [mode, setMode] = useState<AdminMode>("spots")
  const [spots, setSpots] = useState<AdminSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SpotFilter>("pending")
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [photoSpotId, setPhotoSpotId] = useState<number | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [searchSpots, setSearchSpots] = useState("")
  const [searchPhotos, setSearchPhotos] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("date_desc")
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [photoToDelete, setPhotoToDelete] = useState<{ spotId: number; publicId: string } | null>(null)
  const [photoDeleteError, setPhotoDeleteError] = useState<string | null>(null)
  const [editingSpot, setEditingSpot] = useState<{ id: number; name: string; description: string } | null>(null)

  // Pedidos de cambio sobre spots aprobados (pestaña "Cambios pendientes").
  const [changeRequests, setChangeRequests] = useState<AdminChangeRequest[]>([])
  const [changesLoading, setChangesLoading] = useState(true)
  const [changesError, setChangesError] = useState<string | null>(null)
  const [changeActionLoading, setChangeActionLoading] = useState<number | null>(null)
  const [changeActionErrors, setChangeActionErrors] = useState<Record<number, string>>({})
  // Aportes nuevos sobre spots aprobados (misma pestaña). Sus ids son de
  // otra tabla: loading y errores van aparte de los de pedidos de cambio.
  const [contributions, setContributions] = useState<AdminContribution[]>([])
  const [contributionsLoading, setContributionsLoading] = useState(true)
  const [contributionsError, setContributionsError] = useState<string | null>(null)
  const [contributionActionLoading, setContributionActionLoading] = useState<number | null>(null)
  const [contributionActionErrors, setContributionActionErrors] = useState<Record<number, string>>({})
  // Pedidos de cambio de escuelas de surf y servicios de kayak.
  const [operatorChanges, setOperatorChanges] = useState<AdminOperatorChange[]>([])
  const [operatorChangesLoading, setOperatorChangesLoading] = useState(true)
  const [operatorChangesError, setOperatorChangesError] = useState<string | null>(null)
  const [operatorActionLoading, setOperatorActionLoading] = useState<number | null>(null)
  const [operatorActionErrors, setOperatorActionErrors] = useState<Record<number, string>>({})
  // Reportes abiertos (pestaña "Reportes"); acá solo se cargan, para el
  // contador. Las acciones las maneja ReportsTab.
  const [reportGroups, setReportGroups] = useState<ReportGroup[]>([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [reportsError, setReportsError] = useState<string | null>(null)
  // Qué se está rechazando: un pedido de cambio de spot, un aporte o un
  // pedido de cambio de escuela.
  type RejectType = "change" | "contribution" | "operator" | "spot"
  const [rejecting, setRejecting] = useState<{ type: RejectType; id: number } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectError, setRejectError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!token) return
    setChangesError(null)
    api.get<AdminChangeRequest[]>("/admin/change-requests", { token })
      .then(({ data }) => setChangeRequests(Array.isArray(data) ? data : []))
      .catch(() => setChangesError("Error al cargar los cambios pendientes."))
      .finally(() => setChangesLoading(false))
    api.get<AdminContribution[]>("/admin/contributions", { token })
      .then(({ data }) => setContributions(Array.isArray(data) ? data : []))
      .catch(() => setContributionsError("Error al cargar los aportes pendientes."))
      .finally(() => setContributionsLoading(false))
    api.get<AdminOperatorChange[]>("/admin/operator-change-requests", { token })
      .then(({ data }) => setOperatorChanges(Array.isArray(data) ? data : []))
      .catch(() => setOperatorChangesError("Error al cargar los cambios de escuelas."))
      .finally(() => setOperatorChangesLoading(false))
    api.get<ReportGroup[]>("/admin/reports", { token })
      .then(({ data }) => setReportGroups(Array.isArray(data) ? data : []))
      .catch(() => setReportsError("Error al cargar los reportes."))
      .finally(() => setReportsLoading(false))
  }, [token])

  // Aprobar cambia nombre/descripción/fotos del spot: se recarga la lista de
  // spots para que Gestión de spots y Gestión de fotos lo muestren ya.
  async function refreshSpots() {
    const { data } = await api.get<AdminSpot[]>("/admin/spots", { token })
    setSpots(Array.isArray(data) ? data : [])
  }

  function withError(prev: Record<number, string>, id: number, message: string | null) {
    const next = { ...prev }
    if (message) next[id] = message
    else delete next[id]
    return next
  }

  function setChangeError(id: number, message: string | null) {
    setChangeActionErrors(prev => withError(prev, id, message))
  }

  async function handleApproveContribution(id: number) {
    setContributionActionLoading(id)
    setContributionActionErrors(prev => withError(prev, id, null))
    try {
      await api.post(`/admin/contributions/${id}/approve`, undefined, { token })
      setContributions(prev => prev.filter(c => c.id !== id))
    } catch (e) {
      setContributionActionErrors(prev => withError(prev, id,
        e instanceof ApiError && e.status !== 422 ? e.message : "No se pudo aprobar. Intentá de nuevo."))
    } finally {
      setContributionActionLoading(null)
    }
  }

  async function handleApproveChange(id: number) {
    setChangeActionLoading(id)
    setChangeError(id, null)
    try {
      await api.post(`/admin/change-requests/${id}/approve`, undefined, { token })
      setChangeRequests(prev => prev.filter(r => r.id !== id))
      await refreshSpots().catch(() => {})
    } catch (e) {
      // 409: el nombre ya lo tomó otro spot, o el pedido ya se resolvió.
      // 400: ya no entran las fotos (alguien sumó mientras esperaba).
      setChangeError(id, e instanceof ApiError && e.status !== 422 ? e.message : "No se pudo aprobar. Intentá de nuevo.")
    } finally {
      setChangeActionLoading(null)
    }
  }

  async function handleApproveOperatorChange(id: number) {
    setOperatorActionLoading(id)
    setOperatorActionErrors(prev => withError(prev, id, null))
    try {
      await api.post(`/admin/operator-change-requests/${id}/approve`, undefined, { token })
      setOperatorChanges(prev => prev.filter(c => c.id !== id))
    } catch (e) {
      setOperatorActionErrors(prev => withError(prev, id,
        e instanceof ApiError && e.status !== 422 ? e.message : "No se pudo aprobar. Intentá de nuevo."))
    } finally {
      setOperatorActionLoading(null)
    }
  }

  const REJECT_URL: Record<RejectType, (id: number) => string> = {
    change: id => `/admin/change-requests/${id}/reject`,
    contribution: id => `/admin/contributions/${id}/reject`,
    operator: id => `/admin/operator-change-requests/${id}/reject`,
    spot: id => `/admin/spots/${id}/reject`,
  }
  const LOADING_SETTER: Record<RejectType, (v: number | null) => void> = {
    change: setChangeActionLoading, contribution: setContributionActionLoading, operator: setOperatorActionLoading,
    spot: setActionLoading,
  }

  async function handleReject() {
    if (rejecting === null) return
    const { type, id } = rejecting
    // Para un spot el motivo es obligatorio: es lo que el dueño necesita
    // para saber qué corregir.
    if (type === "spot" && !rejectReason.trim()) {
      setRejectError("Escribí el motivo: es lo que va a ver el dueño.")
      return
    }
    const setLoadingFor = LOADING_SETTER[type]
    setLoadingFor(id)
    setRejectError(null)
    try {
      await api.post(REJECT_URL[type](id), { reason: rejectReason.trim() || null }, { token })
      if (type === "change") setChangeRequests(prev => prev.filter(r => r.id !== id))
      else if (type === "contribution") setContributions(prev => prev.filter(c => c.id !== id))
      else if (type === "spot") {
        const now = new Date().toISOString()
        setSpots(prev => prev.map(s => s.id === id ? { ...s, is_approved: false, rejection_reason: rejectReason.trim(), rejected_at: now } : s))
        // Despublicar vuelca su pedido de cambio pendiente sobre el spot.
        setChangeRequests(prev => prev.filter(r => r.spot_id !== id))
      }
      else setOperatorChanges(prev => prev.filter(c => c.id !== id))
      setRejecting(null)
    } catch (e) {
      setRejectError(e instanceof ApiError && e.status !== 422 ? e.message : "No se pudo rechazar. Intentá de nuevo.")
    } finally {
      setLoadingFor(null)
    }
  }

  function openReject(type: RejectType, id: number) {
    setRejecting({ type, id })
    setRejectReason("")
    setRejectError(null)
  }

  async function handleApprove(id: number, approved: boolean) {
    setActionLoading(id)
    await api.patch(`/admin/spots/${id}/approve`, undefined, { token, params: { approved } }).catch(() => {})
    setSpots(prev => prev.map(s => s.id === id ? { ...s, is_approved: approved } : s))
    // Desaprobar un spot vuelca su pedido pendiente sobre el spot (backend,
    // approve_spot): ya no queda nada que revisar en "Cambios pendientes".
    if (!approved) {
      setChangeRequests(prev => prev.filter(r => r.spot_id !== id))
      await refreshSpots().catch(() => {})
    }
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
    setPhotoDeleteError(null)
    try {
      await api.del(`/admin/images/${encodeURIComponent(publicId)}`, { token })
    } catch (e) {
      // La foto sigue en la lista y el modal abierto con el motivo.
      setPhotoDeleteError(e instanceof ApiError && e.status !== 422 ? e.message : "No se pudo eliminar la foto. Intentá de nuevo.")
      setPhotoLoading(false)
      return
    }
    setSpots(prev => prev.map(s => {
      if (s.id !== spotId) return s
      return { ...s, images: s.images.filter(img => img.cloudinary_public_id !== publicId) }
    }))
    setPhotoLoading(false)
    setPhotoToDelete(null)
  }

  // Si falla, el error lo muestra EditSpotModal y el modal queda abierto.
  async function handleSaveEdit() {
    if (!editingSpot) return
    await api.patch(`/admin/spots/${editingSpot.id}`, { name: editingSpot.name, description: editingSpot.description }, { token })
    setSpots(prev => prev.map(s => s.id === editingSpot.id ? { ...s, name: editingSpot.name } : s))
    setEditingSpot(null)
  }

  // Los spots cuyo dueño borró la cuenta se dejan de mostrar en la gestión
  // normal — viven aparte, en la pestaña "Cuentas eliminadas".
  const activeSpots = spots.filter(s => !s.owner_deleted_at)
  const deactivatedSpots = spots
    .filter(s => s.owner_deleted_at)
    .sort((a, b) => new Date(a.owner_deleted_at!).getTime() - new Date(b.owner_deleted_at!).getTime())

  const pending = activeSpots.filter(s => spotStatus(s) === "pending").length
  const rejected = activeSpots.filter(s => spotStatus(s) === "rejected").length
  const pendingReviews = changeRequests.length + contributions.length + operatorChanges.length
  const rejectingSpot = rejecting?.type === "spot" ? spots.find(s => s.id === rejecting.id) ?? null : null
  const filtered = activeSpots.filter(s =>
    filter === "all" ? true : spotStatus(s) === filter
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
            { id: "cambios", label: `📝 Cambios pendientes${pendingReviews > 0 ? ` (${pendingReviews})` : ""}` },
            { id: "reportes", label: `⚑ Reportes${reportGroups.length > 0 ? ` (${reportGroups.length})` : ""}` },
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
            rejected={rejected}
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
            onRejectRequest={spot => openReject("spot", spot.id)}
            onEdit={setEditingSpot}
            onDeleteRequest={setDeleteConfirmId}
          />
        )}

        {mode === "cambios" && (
          <ChangesTab
            requests={changeRequests}
            loadError={changesError}
            loading={changesLoading}
            actionLoading={changeActionLoading}
            actionErrors={changeActionErrors}
            onApprove={handleApproveChange}
            onRejectRequest={id => openReject("change", id)}
          />
        )}

        {mode === "cambios" && (
          <ContributionsList
            contributions={contributions}
            loadError={contributionsError}
            loading={contributionsLoading}
            actionLoading={contributionActionLoading}
            actionErrors={contributionActionErrors}
            onApprove={handleApproveContribution}
            onRejectRequest={id => openReject("contribution", id)}
          />
        )}

        {mode === "cambios" && (
          <OperatorChangesList
            changes={operatorChanges}
            loadError={operatorChangesError}
            loading={operatorChangesLoading}
            actionLoading={operatorActionLoading}
            actionErrors={operatorActionErrors}
            onApprove={handleApproveOperatorChange}
            onRejectRequest={id => openReject("operator", id)}
          />
        )}

        {mode === "reportes" && (
          <ReportsTab
            groups={reportGroups}
            loadError={reportsError}
            loading={reportsLoading}
            token={token}
            onResolved={(group, action) => {
              setReportGroups(prev => prev.filter(g => groupKey(g) !== groupKey(group)))
              // Despublicar o borrar cambia la lista de spots (y sus reseñas).
              if (action !== "dismiss") refreshSpots().catch(() => {})
            }}
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
            onDeletePhotoRequest={(spotId, publicId) => { setPhotoDeleteError(null); setPhotoToDelete({ spotId, publicId }) }}
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
        error={photoDeleteError}
        onCancel={() => { setPhotoToDelete(null); setPhotoDeleteError(null) }}
        onConfirm={() => photoToDelete && handleDeletePhoto(photoToDelete.spotId, photoToDelete.publicId)}
      />

      <ConfirmModal
        open={rejecting !== null}
        title={rejectingSpot
          ? (rejectingSpot.is_approved ? "¿Despublicar este spot?" : "¿Rechazar este spot?")
          : rejecting?.type === "contribution" ? "¿Rechazar este aporte?" : "¿Rechazar este cambio?"}
        message={rejectingSpot
          ? "No se borra: deja de verse (o no se publica) y el dueño ve el motivo en su panel, corrige y lo vuelve a enviar."
          : rejecting?.type === "contribution"
            ? "Se borra, junto con sus fotos. Quien lo propuso ve el rechazo en su perfil, con el motivo si lo escribís."
            : "El dueño ve el rechazo en su panel, con el motivo si lo escribís. Las fotos nuevas del pedido se borran."}
        confirmLabel={rejectingSpot?.is_approved ? "Despublicar" : "Rechazar"}
        loading={rejecting !== null && {
          change: changeActionLoading, contribution: contributionActionLoading, operator: operatorActionLoading,
          spot: actionLoading,
        }[rejecting.type] === rejecting.id}
        loadingLabel="Rechazando..."
        error={rejectError}
        onCancel={() => setRejecting(null)}
        onConfirm={handleReject}
      >
        <label htmlFor="reject-reason" style={{ ...labelStyle, margin: "16px 0 6px" }}>{rejectingSpot ? "Motivo (obligatorio)" : "Motivo (opcional)"}</label>
        <textarea
          id="reject-reason"
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Ej: la foto nueva no es del lugar."
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </ConfirmModal>

      <EditSpotModal
        editingSpot={editingSpot}
        setEditingSpot={setEditingSpot}
        onCancel={() => setEditingSpot(null)}
        onSave={handleSaveEdit}
      />
    </div>
  )
}
