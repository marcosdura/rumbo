"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { uploadImageToCloudinary } from "@/lib/uploadImage"
import Pill from "@/components/ui/Pill"

type AdminSpot = {
  id: number
  name: string
  description?: string
  department: string
  is_approved: boolean
  owner_email: string | null
  slug: string | null
  created_at: string
  category: { name: string } | null
  images: { cloudinary_public_id: string; is_main: boolean; order: number }[]
  review_count?: number
}

type AdminMode = "spots" | "fotos"

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
  const [sortBy, setSortBy] = useState<"name" | "category" | "department" | "date_desc" | "date_asc">("date_desc")
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [editingSpot, setEditingSpot] = useState<{ id: number; name: string; description: string } | null>(null)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const photoUploadRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) return
    setLoadError(null)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/spots`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (r.status === 403) throw new Error("No tenés permisos de administrador con esta cuenta.")
        if (!r.ok) throw new Error("Error al cargar los spots.")
        return r.json()
      })
      .then(data => { setSpots(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(e => { setLoadError(e instanceof Error ? e.message : "Error al cargar los spots."); setLoading(false) })
  }, [token])

  async function handleApprove(id: number, approved: boolean) {
    setActionLoading(id)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/spots/${id}/approve?approved=${approved}`, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    setSpots(prev => prev.map(s => s.id === id ? { ...s, is_approved: approved } : s))
    setActionLoading(null)
  }

  async function handleDelete(id: number) {
    if (deleteConfirmText !== "CONFIRMAR") return
    setActionLoading(id)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    setSpots(prev => prev.filter(s => s.id !== id))
    setActionLoading(null)
    setDeleteConfirmId(null)
    setDeleteConfirmText("")
  }

  async function handleSetMainPhoto(spotId: number, publicId: string) {
    setPhotoLoading(true)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/spots/${spotId}/main-image`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ cloudinary_public_id: publicId }),
    })
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
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/images/${encodeURIComponent(publicId)}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    setSpots(prev => prev.map(s => {
      if (s.id !== spotId) return s
      return { ...s, images: s.images.filter(img => img.cloudinary_public_id !== publicId) }
    }))
    setPhotoLoading(false)
  }

  const pending = spots.filter(s => !s.is_approved).length
  const filtered = spots.filter(s =>
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
  const selectedSpot = spots.find(s => s.id === photoSpotId) ?? null

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .admin-nav { background: linear-gradient(160deg, #1b4332 0%, #2d6a4f 65%, #40916c 100%); padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
        .admin-pill { padding: 7px 18px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.25); background: rgba(255,255,255,0.12); color: #fff; }
        .admin-pill.active { background: #fff; color: #1b4332; border-color: #fff; }
        .admin-pill:not(.active):hover { background: rgba(255,255,255,0.22); }
        .spot-row { background: #fff; border: 1px solid #e0ddd6; border-radius: 16px; padding: 14px 18px; display: flex; align-items: center; gap: 14px; }
        .action-btn-sm { padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.15s; }
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-top: 16px; }
        .photo-card { border-radius: 12px; overflow: hidden; border: 1px solid #e0ddd6; position: relative; background: #f0ede8; }
        .photo-card img { width: 100%; height: 100px; object-fit: cover; display: block; }
      `}</style>

      <nav className="admin-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/RumboLogo.png" alt="Rumbo" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 8 }} />
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
          ] as { id: AdminMode; label: string }[]).map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`admin-pill${mode === m.id ? " active" : ""}`}
              style={{ background: mode === m.id ? "#1b4332" : "#fff", color: mode === m.id ? "#fff" : "#3d3d3a", border: `1px solid ${mode === m.id ? "#1b4332" : "#e0ddd6"}` }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "spots" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["pending", "approved", "all"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                    border: `1px solid ${filter === f ? "#2d6a4f" : "#e0ddd6"}`,
                    background: filter === f ? "#2d6a4f" : "#fff",
                    color: filter === f ? "#fff" : "#3d3d3a",
                  }}
                >
                  {f === "pending" ? `Pendientes (${pending})` : f === "approved" ? "Aprobados" : "Todos"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Buscar por nombre, categoría, departamento..."
                value={searchSpots}
                onChange={e => setSearchSpots(e.target.value)}
                style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 10, border: "1px solid #e0ddd6", fontSize: 13, fontFamily: "inherit", background: "#fff" }}
              />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as "name" | "category" | "department")}
                style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e0ddd6", fontSize: 13, fontFamily: "inherit", background: "#fff" }}
              >
                <option value="date_desc">Más recientes primero</option>
                <option value="date_asc">Más antiguos primero</option>
                <option value="name">Ordenar por nombre</option>
                <option value="category">Ordenar por categoría</option>
                <option value="department">Ordenar por departamento</option>
              </select>
            </div>

            {filter === "pending" && displayed.length > 1 && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                <button
                  onClick={async () => {
                    for (const s of displayed) {
                      await handleApprove(s.id, true)
                    }
                  }}
                  style={{ padding: "7px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#2d6a4f", color: "#fff", border: "none" }}
                >
                  Aprobar todos ({displayed.length})
                </button>
              </div>
            )}

            {loadError ? (
              <p style={{ color: "#dc2626", fontSize: 14 }}>{loadError}</p>
            ) : loading ? (
              <p style={{ color: "#9a9690", fontSize: 14 }}>Cargando...</p>
            ) : displayed.length === 0 ? (
              <p style={{ color: "#9a9690", fontSize: 14 }}>No hay spots en esta categoría.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {displayed.map(spot => {
                  const mainImage = spot.images?.find(i => i.is_main) || spot.images?.[0]
                  return (
                    <div key={spot.id} className="spot-row">
                      <div style={{ width: 64, height: 50, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#f0ede8" }}>
                        {mainImage ? (
                          <img
                            src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_128,h_100,c_fill/${mainImage.cloudinary_public_id}`}
                            alt={spot.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏔️</div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>{spot.name}</span>
                          <Pill variant={spot.is_approved ? "green" : "yellow"} size="sm">
                            {spot.is_approved ? "Aprobado" : "Pendiente"}
                          </Pill>
                        </div>
                        <p style={{ fontSize: 12, color: "#7a7669", margin: 0 }}>
                          {spot.category?.name} · {spot.department}
                        </p>
                        <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: "#9a9690" }}>
                            📷 {spot.images?.length ?? 0} foto{spot.images?.length !== 1 ? "s" : ""}
                          </span>
                          <span style={{ fontSize: 11, color: "#9a9690" }}>
                            ⭐ {spot.review_count ?? 0} reseña{spot.review_count !== 1 ? "s" : ""}
                          </span>
                          {spot.owner_email && (
                            <a href={`mailto:${spot.owner_email}`} style={{ fontSize: 11, color: "#2d6a4f", textDecoration: "none" }}>
                              ✉️ {spot.owner_email}
                            </a>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {!spot.is_approved ? (
                          <button onClick={() => handleApprove(spot.id, true)} disabled={actionLoading === spot.id}
                            className="action-btn-sm" style={{ background: "#2d6a4f", color: "#fff", border: "none", opacity: actionLoading === spot.id ? 0.6 : 1 }}>
                            Aprobar
                          </button>
                        ) : (
                          <button onClick={() => handleApprove(spot.id, false)} disabled={actionLoading === spot.id}
                            className="action-btn-sm" style={{ background: "#fff", color: "#3d3d3a", border: "1px solid #e0ddd6", opacity: actionLoading === spot.id ? 0.6 : 1 }}>
                            Desaprobar
                          </button>
                        )}
                        <a href={`/spots/${spot.slug ?? spot.id}`} target="_blank" rel="noopener noreferrer"
                          className="action-btn-sm" style={{ background: "#fff", color: "#3d3d3a", border: "1px solid #e0ddd6", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                          Ver
                        </a>
                        <button
                          onClick={() => navigator.clipboard.writeText(`https://rumboapp.uy/spots/${spot.slug ?? spot.id}`)}
                          className="action-btn-sm"
                          style={{ background: "#fff", color: "#3d3d3a", border: "1px solid #e0ddd6" }}
                        >
                          🔗
                        </button>
                        <button
                          onClick={() => setEditingSpot({ id: spot.id, name: spot.name, description: spot.description ?? "" })}
                          className="action-btn-sm"
                          style={{ background: "#fff", color: "#3d3d3a", border: "1px solid #e0ddd6" }}
                        >
                          ✏️
                        </button>
                        <button onClick={() => { setDeleteConfirmId(spot.id); setDeleteConfirmText("") }} disabled={actionLoading === spot.id}
                          className="action-btn-sm" style={{ background: "#fff", color: "#dc2626", border: "1px solid #fecaca", opacity: actionLoading === spot.id ? 0.6 : 1 }}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {mode === "fotos" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Buscar spot..."
                value={searchPhotos}
                onChange={e => setSearchPhotos(e.target.value)}
                style={{ width: "100%", maxWidth: 400, padding: "8px 12px", borderRadius: 10, border: "1px solid #e0ddd6", fontSize: 13, fontFamily: "inherit", background: "#fff", marginBottom: 8, display: "block" }}
              />
              <select
                style={{ padding: "9px 12px", borderRadius: 12, border: "1px solid #e0ddd6", fontSize: 14, background: "#fff", fontFamily: "inherit", width: "100%", maxWidth: 400 }}
                value={photoSpotId ?? ""}
                onChange={e => setPhotoSpotId(Number(e.target.value) || null)}
              >
                <option value="">— Seleccioná un spot —</option>
                {spots
                  .filter(s => s.name.toLowerCase().includes(searchPhotos.toLowerCase()))
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category?.name})</option>
                  ))}
              </select>
            </div>

            {selectedSpot && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <input
                    ref={photoUploadRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      if (!selectedSpot) return
                      const files = Array.from(e.target.files ?? [])
                      if (!files.length) return
                      setUploadingPhotos(true)
                      try {
                        const results = await Promise.all(files.map((file, i) =>
                          uploadImageToCloudinary(file, {
                            category: selectedSpot.category?.name ?? "Spot",
                            spotName: selectedSpot.name,
                            index: (selectedSpot.images?.length ?? 0) + i,
                            spotId: selectedSpot.id,
                          })
                        ))

                        await Promise.all(results.map(({ publicId }, i) => {
                          const params = new URLSearchParams({
                            cloudinary_public_id: publicId,
                            is_main: "false",
                            order: String((selectedSpot.images?.length ?? 0) + i),
                          })
                          return fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/spots/${selectedSpot.id}?${params}`, {
                            method: "POST",
                            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                          })
                        }))

                        const updated = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/spots`, {
                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                        }).then(r => r.json())
                        setSpots(updated)
                      } catch {
                        alert("Error al subir fotos")
                      } finally {
                        setUploadingPhotos(false)
                        if (photoUploadRef.current) photoUploadRef.current.value = ""
                      }
                    }}
                  />
                  <button
                    onClick={() => photoUploadRef.current?.click()}
                    disabled={uploadingPhotos}
                    style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#2d6a4f", color: "#fff", border: "none", opacity: uploadingPhotos ? 0.6 : 1 }}
                  >
                    {uploadingPhotos ? "Subiendo..." : "+ Agregar fotos"}
                  </button>
                </div>

                <p style={{ fontSize: 13, color: "#7a7669", marginBottom: 12 }}>
                  {selectedSpot.images.length} foto{selectedSpot.images.length !== 1 ? "s" : ""} · La primera es la principal
                </p>
                <div className="photo-grid">
                  {[...selectedSpot.images]
                    .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
                    .map(img => (
                      <div key={img.cloudinary_public_id} className="photo-card">
                        <img
                          src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_280,h_200,c_fill/${img.cloudinary_public_id}`}
                          alt=""
                        />
                        {img.is_main && (
                          <div style={{ position: "absolute", top: 6, left: 6, background: "#2d6a4f", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>
                            Principal
                          </div>
                        )}
                        <div style={{ padding: "8px 8px 6px", display: "flex", gap: 5 }}>
                          {!img.is_main && (
                            <button
                              onClick={() => handleSetMainPhoto(selectedSpot.id, img.cloudinary_public_id)}
                              disabled={photoLoading}
                              style={{ flex: 1, padding: "4px 0", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#e8f5ee", color: "#1b4332", border: "1px solid #b7dfc8" }}
                            >
                              Hacer principal
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePhoto(selectedSpot.id, img.cloudinary_public_id)}
                            disabled={photoLoading}
                            style={{ padding: "4px 8px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "#dc2626", border: "1px solid #fecaca" }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {deleteConfirmId !== null && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "28px 32px", maxWidth: 400, width: "90%", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#1b1b19", marginBottom: 8 }}>¿Eliminar este spot?</p>
            <p style={{ fontSize: 13, color: "#7a7669", marginBottom: 20, lineHeight: 1.5 }}>
              Esta acción no se puede deshacer. Escribí <strong>CONFIRMAR</strong> para continuar.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="CONFIRMAR"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e0ddd6", fontSize: 14, fontFamily: "inherit", marginBottom: 16, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setDeleteConfirmId(null); setDeleteConfirmText("") }}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #e0ddd6", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleteConfirmText !== "CONFIRMAR" || actionLoading === deleteConfirmId}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: deleteConfirmText === "CONFIRMAR" ? "#dc2626" : "#f0ede8", color: deleteConfirmText === "CONFIRMAR" ? "#fff" : "#b0ac9e", fontSize: 13, fontWeight: 600, cursor: deleteConfirmText === "CONFIRMAR" ? "pointer" : "not-allowed", fontFamily: "inherit" }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSpot !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "28px 32px", maxWidth: 480, width: "90%", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#1b1b19", marginBottom: 20 }}>Editar spot</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#7a7669", marginBottom: 4 }}>Nombre</p>
                <input
                  value={editingSpot.name}
                  onChange={e => setEditingSpot(prev => prev ? { ...prev, name: e.target.value } : null)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e0ddd6", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#7a7669", marginBottom: 4 }}>Descripción</p>
                <textarea
                  value={editingSpot.description}
                  onChange={e => setEditingSpot(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={4}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e0ddd6", fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setEditingSpot(null)}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #e0ddd6", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!editingSpot) return
                  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/spots/${editingSpot.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: JSON.stringify({ name: editingSpot.name, description: editingSpot.description }),
                  })
                  setSpots(prev => prev.map(s => s.id === editingSpot.id ? { ...s, name: editingSpot.name } : s))
                  setEditingSpot(null)
                }}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#2d6a4f", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
