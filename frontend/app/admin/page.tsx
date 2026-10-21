"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Navbar from "@/components/layout/Navbar"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { api, ApiError } from "@/lib/api"
import { spotStatus, ADMIN_MODES, type AdminSpot, type AdminMode, type SortBy, type AdminChangeRequest, type SpotFilter } from "./types"
import SummaryTab, { type AdminSummary } from "./SummaryTab"
import SpotsTab from "./SpotsTab"
import PhotosTab from "./PhotosTab"
import DeactivatedTab from "./DeactivatedTab"
import ChangesTab from "./ChangesTab"
import ContributionsList from "./ContributionsList"
import ReportsTab, { groupKey, type ReportGroup } from "./ReportsTab"
import ClaimsTab, { type AdminClaim } from "./ClaimsTab"
import type { AdminContribution } from "@/lib/contributions"
import EditSpotModal from "./EditSpotModal"
import AdminSidebar from "./AdminSidebar"
import ImportRoutesTab from "./ImportRoutesTab"
import RejectModal, { type RejectType } from "./RejectModal"
import { TAB_GROUPS, listsFor, sectionTitle, splitByOwner, tabCounts, visibleSpots } from "./adminNav"
import { FORBIDDEN, useLazyList } from "./useLazyList"
import { useSpotActions } from "./useSpotActions"

function withError(prev: Record<number, string>, id: number, message: string | null) {
  const next = { ...prev }
  if (message) next[id] = message
  else delete next[id]
  return next
}

const REJECT_URL: Record<RejectType, (id: number) => string> = {
  change: id => `/admin/change-requests/${id}/reject`,
  contribution: id => `/admin/contributions/${id}/reject`,
  spot: id => `/admin/spots/${id}/reject`,
}

export default function AdminPage() {
  const { data: session } = useSession()
  const token = session?.id_token
  const [mode, setMode] = useState<AdminMode>("resumen")
  // La portada (GET /admin/summary): también da los contadores de las
  // pestañas hasta que se abre cada una.
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  // Qué datos ya se pidieron: cada lista se carga recién al abrir su pestaña.
  const [opened, setOpened] = useState({ spots: false, cambios: false, reportes: false, reclamos: false })
  const wants = listsFor(mode)
  if ((Object.keys(wants) as (keyof typeof wants)[]).some(k => wants[k] && !opened[k])) {
    setOpened(prev => ({
      spots: prev.spots || wants.spots, cambios: prev.cambios || wants.cambios,
      reportes: prev.reportes || wants.reportes, reclamos: prev.reclamos || wants.reclamos,
    }))
  }

  const spotList = useLazyList<AdminSpot>("/admin/spots", token, opened.spots, "Error al cargar los spots.")
  // Pedidos de cambio sobre spots aprobados y aportes nuevos (pestaña
  // "Cambios y aportes"). Sus ids son de tablas distintas: loading y
  // errores van aparte.
  const changeList = useLazyList<AdminChangeRequest>("/admin/change-requests", token, opened.cambios, "Error al cargar los cambios pendientes.")
  const contributionList = useLazyList<AdminContribution>("/admin/contributions", token, opened.cambios, "Error al cargar los aportes pendientes.")
  // Reportes abiertos y pedidos para hacerse cargo de un lugar sugerido:
  // acá solo se cargan (para el contador); las acciones van en sus pestañas.
  const reportList = useLazyList<ReportGroup>("/admin/reports", token, opened.reportes, "Error al cargar los reportes.")
  const claimList = useLazyList<AdminClaim>("/admin/claims", token, opened.reclamos, "Error al cargar los pedidos de responsables.")
  const spots = spotList.items
  const setSpots = spotList.setItems
  // Aprobar un cambio, despublicar o resolver un reporte cambian nombre,
  // descripción o fotos: se recarga la lista para que Lugares y Fotos lo
  // muestren ya.
  const refreshSpots = spotList.refresh

  const [filter, setFilter] = useState<SpotFilter>("all")
  const [searchSpots, setSearchSpots] = useState("")
  const [searchPhotos, setSearchPhotos] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("date_desc")
  const [photoSpotId, setPhotoSpotId] = useState<number | null>(null)
  const [changeActionLoading, setChangeActionLoading] = useState<number | null>(null)
  const [changeActionErrors, setChangeActionErrors] = useState<Record<number, string>>({})
  const [contributionActionLoading, setContributionActionLoading] = useState<number | null>(null)
  const [contributionActionErrors, setContributionActionErrors] = useState<Record<number, string>>({})
  const [rejecting, setRejecting] = useState<{ type: RejectType; id: number } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectError, setRejectError] = useState<string | null>(null)
  // Error de una acción (aprobar, reactivar, foto principal).
  const [notice, setNotice] = useState<string | null>(null)

  const actions = useSpotActions({
    token, spots, setSpots, refreshSpots, setNotice,
    onUnpublished: id => changeList.setItems(prev => prev.filter(r => r.spot_id !== id)),
  })

  // La pestaña de la URL (/admin?tab=reportes), al entrar.
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab") as AdminMode | null
    if (tab && ADMIN_MODES.includes(tab)) setMode(tab)
  }, [])

  function go(next: AdminMode) {
    setMode(next)
    setNotice(null)
    window.history.replaceState(null, "", next === "resumen" ? "/admin" : `/admin?tab=${next}`)
  }

  // El resumen se vuelve a pedir cada vez que se abre (los números cambian
  // al aprobar o rechazar en las otras pestañas).
  const onSummary = mode === "resumen"
  useEffect(() => {
    if (!token || !onSummary) return
    setSummaryError(null)
    api.get<AdminSummary>("/admin/summary", { token })
      .then(({ data }) => setSummary(data))
      .catch(e => setSummaryError(e instanceof ApiError && e.status === 403 ? FORBIDDEN : "No se pudo cargar el resumen."))
  }, [token, onSummary])

  async function handleApproveContribution(id: number) {
    setContributionActionLoading(id)
    setContributionActionErrors(prev => withError(prev, id, null))
    try {
      await api.post(`/admin/contributions/${id}/approve`, undefined, { token })
      contributionList.setItems(prev => prev.filter(c => c.id !== id))
    } catch (e) {
      setContributionActionErrors(prev => withError(prev, id,
        e instanceof ApiError && e.status !== 422 ? e.message : "No se pudo aprobar. Intentá de nuevo."))
    } finally {
      setContributionActionLoading(null)
    }
  }

  async function handleApproveChange(id: number) {
    setChangeActionLoading(id)
    setChangeActionErrors(prev => withError(prev, id, null))
    try {
      await api.post(`/admin/change-requests/${id}/approve`, undefined, { token })
      changeList.setItems(prev => prev.filter(r => r.id !== id))
      await refreshSpots().catch(() => {})
    } catch (e) {
      // 409: el nombre ya lo tomó otro spot, o el pedido ya se resolvió.
      // 400: ya no entran las fotos (alguien sumó mientras esperaba).
      setChangeActionErrors(prev => withError(prev, id, e instanceof ApiError && e.status !== 422 ? e.message : "No se pudo aprobar. Intentá de nuevo."))
    } finally {
      setChangeActionLoading(null)
    }
  }

  const LOADING_SETTER: Record<RejectType, (v: number | null) => void> = {
    change: setChangeActionLoading, contribution: setContributionActionLoading, spot: actions.setActionLoading,
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
      if (type === "change") changeList.setItems(prev => prev.filter(r => r.id !== id))
      else if (type === "contribution") contributionList.setItems(prev => prev.filter(c => c.id !== id))
      else if (type === "spot") {
        const now = new Date().toISOString()
        setSpots(prev => prev.map(s => s.id === id ? { ...s, is_approved: false, rejection_reason: rejectReason.trim(), rejected_at: now } : s))
        // Despublicar vuelca su pedido de cambio pendiente sobre el spot.
        changeList.setItems(prev => prev.filter(r => r.spot_id !== id))
      }
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

  const { active: activeSpots, deactivated: deactivatedSpots } = splitByOwner(spots)
  const pending = activeSpots.filter(s => spotStatus(s) === "pending").length
  const rejected = activeSpots.filter(s => spotStatus(s) === "rejected").length
  const rejectingSpot = rejecting?.type === "spot" ? spots.find(s => s.id === rejecting.id) ?? null : null
  // "Lugares nuevos" es la lista fija en pendientes.
  const shownFilter: SpotFilter = mode === "nuevos" ? "pending" : filter
  const displayed = visibleSpots(activeSpots, shownFilter, searchSpots, sortBy)
  const counts = tabCounts(summary, {
    spots: { loaded: opened.spots && !spotList.loading, pending, deactivated: deactivatedSpots.length },
    cambios: { loaded: opened.cambios && !changeList.loading && !contributionList.loading, count: changeList.items.length + contributionList.items.length },
    reportes: { loaded: opened.reportes && !reportList.loading, count: reportList.items.length },
    reclamos: { loaded: opened.reclamos && !claimList.loading, count: claimList.items.length },
  })

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`
        .spot-row { background: #fff; border: 1px solid var(--border); border-radius: 20px; box-shadow: var(--shadow-card); padding: 14px 18px; display: flex; align-items: center; gap: 14px; }
        .action-btn-sm { padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.15s; }
        /* Todo el ancho de la pantalla: la barra lateral y el contenido. */
        .admin-layout { display: flex; gap: 24px; padding: 24px 24px 60px; max-width: 1600px; margin: 0 auto; box-sizing: border-box; }
        .admin-main { flex: 1; min-width: 0; }
        .admin-title { font-size: 24px; font-weight: 700; color: #1b1b19; margin: 4px 0 18px; }
        @media (max-width: 860px) {
          .admin-layout { flex-direction: column; gap: 14px; padding: 14px 14px 48px; }
          .admin-title { font-size: 20px; margin-bottom: 12px; }
        }
      `}</style>

      <Navbar />

      <div className="admin-layout">
        <AdminSidebar groups={TAB_GROUPS} mode={mode} counts={counts} onGo={go} />

      <main id="contenido" className="admin-main">
        {/* El nombre de la sección (antes: "Panel de administración", con
            "Volver al inicio", "modo admin" y "+ Agregar lugar"). */}
        <h1 className="admin-title">{sectionTitle(mode)}</h1>

        {notice && (
          <div role="alert" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#fdf0f0", border: "1px solid #fecaca", color: "#7c1d1d", borderRadius: 12, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso" style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 14 }}>✕</button>
          </div>
        )}

        {mode === "resumen" && (
          <SummaryTab summary={summary} loading={!summary && !summaryError} error={summaryError} onGo={go} />
        )}

        {(mode === "nuevos" || mode === "lugares") && (
          <SpotsTab
            displayed={displayed}
            pending={pending}
            rejected={rejected}
            showFilters={mode === "lugares"}
            filter={shownFilter}
            setFilter={setFilter}
            searchSpots={searchSpots}
            setSearchSpots={setSearchSpots}
            sortBy={sortBy}
            setSortBy={setSortBy}
            loadError={spotList.error}
            loading={spotList.loading}
            actionLoading={actions.actionLoading}
            onApprove={actions.approve}
            onRejectRequest={spot => openReject("spot", spot.id)}
            onEdit={actions.setEditingSpot}
            onDeleteRequest={actions.requestDelete}
            onApproveAllRequest={actions.setApproveAll}
          />
        )}

        {mode === "cambios" && (
          <ChangesTab
            requests={changeList.items}
            loadError={changeList.error}
            loading={changeList.loading}
            actionLoading={changeActionLoading}
            actionErrors={changeActionErrors}
            onApprove={handleApproveChange}
            onRejectRequest={id => openReject("change", id)}
          />
        )}

        {mode === "cambios" && (
          <ContributionsList
            contributions={contributionList.items}
            loadError={contributionList.error}
            loading={contributionList.loading}
            actionLoading={contributionActionLoading}
            actionErrors={contributionActionErrors}
            onApprove={handleApproveContribution}
            onRejectRequest={id => openReject("contribution", id)}
          />
        )}

        {mode === "reportes" && (
          <ReportsTab
            groups={reportList.items}
            loadError={reportList.error}
            loading={reportList.loading}
            token={token}
            onResolved={(group, action) => {
              reportList.setItems(prev => prev.filter(g => groupKey(g) !== groupKey(group)))
              // Despublicar o borrar cambia la lista de spots (y sus reseñas).
              if (action !== "dismiss") refreshSpots().catch(() => {})
            }}
          />
        )}

        {mode === "reclamos" && (
          <ClaimsTab
            claims={claimList.items}
            loadError={claimList.error}
            loading={claimList.loading}
            token={token}
            onResolved={(claim, approved) => {
              // Aprobar rechaza los demás pedidos del lugar y le cambia el dueño.
              claimList.setItems(prev => prev.filter(c => (approved ? c.spot.id !== claim.spot.id : c.id !== claim.id)))
              if (approved) refreshSpots().catch(() => {})
            }}
          />
        )}

        {mode === "importar-vias" && <ImportRoutesTab spots={spots} token={token} loading={spotList.loading} />}

        {mode === "fotos" && (
          <PhotosTab
            spots={spots}
            token={token}
            searchPhotos={searchPhotos}
            setSearchPhotos={setSearchPhotos}
            photoSpotId={photoSpotId}
            setPhotoSpotId={setPhotoSpotId}
            photoLoading={actions.photoLoading}
            onSetMainPhoto={actions.setMainPhoto}
            onDeletePhotoRequest={actions.requestPhotoDelete}
            onSpotsRefreshed={setSpots}
          />
        )}

        {mode === "cuentas-eliminadas" && (
          <DeactivatedTab
            deactivatedSpots={deactivatedSpots}
            loadError={spotList.error}
            loading={spotList.loading}
            actionLoading={actions.actionLoading}
            onReactivate={actions.reactivate}
            onDeleteRequest={actions.requestDelete}
          />
        )}
      </main>
      </div>

      <ConfirmModal
        open={actions.deleteConfirmId !== null}
        title="¿Eliminar este spot?"
        message="Esta acción no se puede deshacer."
        confirmPhrase="CONFIRMAR"
        loading={actions.actionLoading === actions.deleteConfirmId}
        error={actions.deleteError}
        onCancel={() => actions.setDeleteConfirmId(null)}
        onConfirm={() => actions.deleteConfirmId !== null && actions.remove(actions.deleteConfirmId)}
      />

      <ConfirmModal
        open={actions.approveAll !== null}
        title={`¿Aprobar ${actions.approveAll?.length ?? 0} lugares?`}
        message="Se publican todos los que estás viendo en la lista. Si alguno falla, se frena ahí."
        confirmLabel="Aprobar todos"
        loading={actions.approvingAll}
        loadingLabel="Aprobando..."
        onCancel={() => actions.setApproveAll(null)}
        onConfirm={actions.approveAllConfirmed}
      />

      <ConfirmModal
        open={actions.photoToDelete !== null}
        title="¿Eliminar esta foto?"
        message="La foto se borra de Cloudinary y no se puede recuperar."
        loading={actions.photoLoading}
        error={actions.photoDeleteError}
        onCancel={() => { actions.setPhotoToDelete(null); actions.setPhotoDeleteError(null) }}
        onConfirm={() => actions.photoToDelete && actions.deletePhoto(actions.photoToDelete.spotId, actions.photoToDelete.publicId)}
      />

      <RejectModal
        rejecting={rejecting}
        spot={rejectingSpot}
        reason={rejectReason}
        setReason={setRejectReason}
        loading={rejecting !== null && {
          change: changeActionLoading, contribution: contributionActionLoading, spot: actions.actionLoading,
        }[rejecting.type] === rejecting.id}
        error={rejectError}
        onCancel={() => setRejecting(null)}
        onConfirm={handleReject}
      />

      <EditSpotModal
        editingSpot={actions.editingSpot}
        setEditingSpot={actions.setEditingSpot}
        onCancel={() => actions.setEditingSpot(null)}
        onSave={actions.saveEdit}
      />
    </div>
  )
}
