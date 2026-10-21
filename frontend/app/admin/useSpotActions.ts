"use client"

// Lo que el admin hace sobre los lugares desde el panel: aprobar (uno o
// todos), desaprobar, borrar, reactivar, editar nombre y descripción, y sus
// fotos (principal y borrar). Con el estado de cada acción y sus modales.
// Los errores se muestran: antes se ignoraban y la pantalla mostraba el
// cambio aunque el backend fallara.
import { useState, type Dispatch, type SetStateAction } from "react"
import { api, ApiError } from "@/lib/api"
import type { AdminSpot } from "./types"

// El motivo del backend sirve si es un 4xx (ej. 409 "ya se resolvió"); un
// 500 o un error de red dicen "Error 500": ahí va el texto propio.
export const errorText = (e: unknown, fallback: string) =>
  (e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 422 ? e.message : fallback)

export function useSpotActions({ token, spots, setSpots, refreshSpots, setNotice, onUnpublished }: {
  token: string | undefined
  spots: AdminSpot[]
  setSpots: Dispatch<SetStateAction<AdminSpot[]>>
  refreshSpots: () => Promise<void>
  setNotice: (notice: string | null) => void
  // Despublicar un lugar vuelca su pedido de cambio pendiente sobre el lugar
  // (backend, approve_spot): ya no queda nada que revisar en "Cambios".
  onUnpublished: (spotId: number) => void
}) {
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [photoToDelete, setPhotoToDelete] = useState<{ spotId: number; publicId: string } | null>(null)
  const [photoDeleteError, setPhotoDeleteError] = useState<string | null>(null)
  const [editingSpot, setEditingSpot] = useState<{ id: number; name: string; description: string } | null>(null)
  // "Aprobar todos": pide confirmación antes.
  const [approveAll, setApproveAll] = useState<AdminSpot[] | null>(null)
  const [approvingAll, setApprovingAll] = useState(false)

  const spotName = (id: number) => spots.find(s => s.id === id)?.name ?? "el lugar"
  const updateSpot = (id: number, change: (s: AdminSpot) => AdminSpot) => setSpots(prev => prev.map(s => s.id === id ? change(s) : s))

  // true si se pudo.
  async function approve(id: number, approved: boolean): Promise<boolean> {
    setActionLoading(id)
    setNotice(null)
    try {
      await api.patch(`/admin/spots/${id}/approve`, undefined, { token, params: { approved } })
    } catch (e) {
      setNotice(errorText(e, `No se pudo ${approved ? "aprobar" : "desaprobar"} «${spotName(id)}». Intentá de nuevo.`))
      setActionLoading(null)
      return false
    }
    updateSpot(id, s => ({ ...s, is_approved: approved }))
    if (!approved) {
      onUnpublished(id)
      await refreshSpots().catch(() => {})
    }
    setActionLoading(null)
    return true
  }

  // Aprueba uno por uno; si uno falla, se frena ahí (con el aviso de cuál).
  async function approveAllConfirmed() {
    if (!approveAll) return
    setApprovingAll(true)
    for (const s of approveAll) {
      if (!(await approve(s.id, true))) break
    }
    setApprovingAll(false)
    setApproveAll(null)
  }

  function requestDelete(id: number) {
    setDeleteError(null)
    setDeleteConfirmId(id)
  }

  // Si falla, el modal queda abierto con el error.
  async function remove(id: number) {
    setActionLoading(id)
    setDeleteError(null)
    try {
      await api.del(`/spots/${id}`, { token })
    } catch (e) {
      setDeleteError(errorText(e, "No se pudo eliminar. Intentá de nuevo."))
      setActionLoading(null)
      return
    }
    setSpots(prev => prev.filter(s => s.id !== id))
    setActionLoading(null)
    setDeleteConfirmId(null)
  }

  async function reactivate(id: number) {
    setActionLoading(id)
    setNotice(null)
    try {
      await api.patch(`/admin/spots/${id}/reactivate`, undefined, { token })
      updateSpot(id, s => ({ ...s, owner_deleted_at: null }))
    } catch (e) {
      setNotice(errorText(e, `No se pudo reactivar «${spotName(id)}». Intentá de nuevo.`))
    }
    setActionLoading(null)
  }

  async function setMainPhoto(spotId: number, publicId: string) {
    setPhotoLoading(true)
    setNotice(null)
    try {
      await api.patch(`/admin/spots/${spotId}/main-image`, { cloudinary_public_id: publicId }, { token })
    } catch (e) {
      setNotice(errorText(e, "No se pudo cambiar la foto principal. Intentá de nuevo."))
      setPhotoLoading(false)
      return
    }
    updateSpot(spotId, s => ({ ...s, images: s.images.map(img => ({ ...img, is_main: img.cloudinary_public_id === publicId })) }))
    setPhotoLoading(false)
  }

  function requestPhotoDelete(spotId: number, publicId: string) {
    setPhotoDeleteError(null)
    setPhotoToDelete({ spotId, publicId })
  }

  async function deletePhoto(spotId: number, publicId: string) {
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
    updateSpot(spotId, s => ({ ...s, images: s.images.filter(img => img.cloudinary_public_id !== publicId) }))
    setPhotoLoading(false)
    setPhotoToDelete(null)
  }

  // Si falla, el error lo muestra EditSpotModal y el modal queda abierto.
  async function saveEdit() {
    if (!editingSpot) return
    await api.patch(`/admin/spots/${editingSpot.id}`, { name: editingSpot.name, description: editingSpot.description }, { token })
    updateSpot(editingSpot.id, s => ({ ...s, name: editingSpot.name }))
    setEditingSpot(null)
  }

  return {
    actionLoading, setActionLoading, photoLoading,
    approve, approveAll, setApproveAll, approvingAll, approveAllConfirmed,
    deleteConfirmId, setDeleteConfirmId, deleteError, requestDelete, remove,
    reactivate,
    setMainPhoto, photoToDelete, setPhotoToDelete, photoDeleteError, setPhotoDeleteError, requestPhotoDelete, deletePhoto,
    editingSpot, setEditingSpot, saveEdit,
  }
}
