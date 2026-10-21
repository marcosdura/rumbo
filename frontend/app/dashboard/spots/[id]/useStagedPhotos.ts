"use client"

// Las fotos del panel del dueño: las elegidas que todavía no se subieron
// (se suben a Cloudinary recién al guardar, así si el dueño se arrepiente no
// quedan archivos sueltos), elegir la principal y borrar.
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { api } from "@/lib/api"
import { checkNewPhotos } from "./changes"
import type { Spot, StagedPhoto } from "./types"

export function useStagedPhotos(spot: Spot | null, setSpot: Dispatch<SetStateAction<Spot | null>>, token: string | undefined) {
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([])
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Liberar las previews (URL.createObjectURL) al salir de la página.
  const stagedRef = useRef(stagedPhotos)
  useEffect(() => { stagedRef.current = stagedPhotos }, [stagedPhotos])
  useEffect(() => () => stagedRef.current.forEach(p => URL.revokeObjectURL(p.url)), [])

  function add(files: File[]) {
    if (!spot) return
    const { accepted, error } = checkNewPhotos(files, (spot.images?.length ?? 0) + stagedPhotos.length)
    if (accepted.length) {
      setStagedPhotos(prev => [...prev, ...accepted.map(file => ({ file, url: URL.createObjectURL(file) }))])
    }
    setPhotoError(error)
  }

  function removeStaged(index: number) {
    setStagedPhotos(prev => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
    setPhotoError(null)
  }

  // Ya subidas y guardadas: se sueltan las previews.
  function clearStaged() {
    stagedPhotos.forEach(p => URL.revokeObjectURL(p.url))
    setStagedPhotos([])
  }

  async function setMain(publicId: string) {
    if (!spot) return
    setPhotoLoading(true)
    setPhotoError(null)
    try {
      await api.patch(`/admin/spots/${spot.id}/main-image`, { cloudinary_public_id: publicId }, { token })
      setSpot(prev => prev ? {
        ...prev,
        images: prev.images.map(img => ({ ...img, is_main: img.cloudinary_public_id === publicId })),
      } : null)
    } catch {
      setPhotoError("No se pudo cambiar la foto principal. Intentá de nuevo.")
    } finally {
      setPhotoLoading(false)
    }
  }

  function requestDelete(publicId: string) {
    setDeleteError(null)
    setPhotoToDelete(publicId)
  }

  async function deletePhoto(publicId: string) {
    if (!spot) return
    setPhotoLoading(true)
    setDeleteError(null)
    try {
      await api.del(`/admin/images/${encodeURIComponent(publicId)}`, { token })
      setSpot(prev => prev ? { ...prev, images: prev.images.filter(img => img.cloudinary_public_id !== publicId) } : null)
      setPhotoToDelete(null)
    } catch {
      setDeleteError("No se pudo eliminar la foto. Intentá de nuevo.")
    } finally {
      setPhotoLoading(false)
    }
  }

  return {
    stagedPhotos, photoError, setPhotoError, photoLoading,
    add, removeStaged, clearStaged, setMain,
    photoToDelete, setPhotoToDelete, deleteError, requestDelete, deletePhoto,
  }
}
