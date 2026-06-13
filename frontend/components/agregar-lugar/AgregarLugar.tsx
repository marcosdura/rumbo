"use client"

import { useState, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { s, mediaQuery } from "./styles"
import {
  defaultTrekkingFeatures, defaultRoute, defaultSector, defaultSurf, defaultKayak, emptyBasic,
  REQUIRED_FEATURE_KEYS,
} from "./constants"
import { submitAgregarLugar, buildPublicId } from "./submit"
import StepCategoria from "./steps/StepCategoria"
import StepInfoBasica from "./steps/StepInfoBasica"
import StepServicioSpot from "./steps/StepServicioSpot"
import StepAmenities from "./steps/StepAmenities"
import StepTrekkingCaracteristicas from "./steps/StepTrekkingCaracteristicas"
import StepEscalada from "./steps/StepEscalada"
import StepSurf from "./steps/StepSurf"
import StepKayak from "./steps/StepKayak"
import StepRutas from "./steps/StepRutas"
import StepImagenes from "./steps/StepImagenes"
import StepResumen from "./steps/StepResumen"
import StepClimbingMode from "./steps/StepClimbingMode"
import StepClimbingSpotSelector from "./steps/StepClimbingSpotSelector"
import StepClimbingSectorForm from "./steps/StepClimbingSectorForm"
import StepClimbingSectorSelector from "./steps/StepClimbingSectorSelector"
import StepClimbingRouteForm from "./steps/StepClimbingRouteForm"
import StepTrekkingMode from "./steps/StepTrekkingMode"
import StepTrekkingSpotSelector from "./steps/StepTrekkingSpotSelector"
import type {
  Category, TrekkingFeatures, TrekkingFeatureKey, RouteItem, SectorItem,
  SurfItem, KayakItem, BasicInfo, ClimbingMode, ClimbingRouteForm, TrekkingMode,
} from "./types"

export default function AgregarLugar() {
  const { data: session } = useSession()
  const token = session?.id_token

  const [step, setStep]                           = useState(1)
  const [selectedCat, setSelectedCat]             = useState<Category | null>(null)
  const [basic, setBasic]                         = useState<BasicInfo>(emptyBasic())
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [trekkingFeatures, setTrekkingFeatures]   = useState<TrekkingFeatures>(defaultTrekkingFeatures())
  const [routes, setRoutes]                       = useState<RouteItem[]>([defaultRoute()])
  const [sectors, setSectors]                     = useState<SectorItem[]>([defaultSector()])
  const [surf, setSurf]                           = useState<SurfItem>(defaultSurf())
  const [kayaks, setKayaks]                       = useState<KayakItem[]>([defaultKayak()])
  const [images, setImages]                       = useState<File[]>([])
  const [previews, setPreviews]                   = useState<string[]>([])
  const [surfPhotoFiles, setSurfPhotoFiles]       = useState<(File | null)[]>([null, null, null])
  const [surfPhotoPreviews, setSurfPhotoPreviews] = useState<(string | null)[]>([null, null, null])
  const [kayakPhotoFiles, setKayakPhotoFiles]     = useState<(File | null)[]>([null, null, null])
  const [kayakPhotoPreviews, setKayakPhotoPreviews] = useState<(string | null)[]>([null, null, null])
  const [isPublic, setIsPublic]                   = useState<boolean | null>(null)
  const [publicTransport, setPublicTransport]     = useState<string | null>(null)
  const [featureErrors, setFeatureErrors]         = useState<Set<TrekkingFeatureKey>>(new Set())
  const [submitting, setSubmitting]               = useState(false)
  const [uploadProgress, setUploadProgress]       = useState<string | null>(null)
  const [error, setError]                         = useState<string | null>(null)
  const [success, setSuccess]                     = useState(false)
  const [selectedSpotId, setSelectedSpotId]       = useState<number | null>(null)
  const [availableSpots, setAvailableSpots]       = useState<{ id: number; name: string }[]>([])
  const [loadingSpots, setLoadingSpots]           = useState(false)

  // Climbing & service-spot creation states
  const [climbingMode, setClimbingMode]           = useState<ClimbingMode>(null)
  const [creatingNewSpot, setCreatingNewSpot]     = useState(false)
  const [climbingSpotId, setClimbingSpotId]       = useState<number | null>(null)
  const [climbingSectorId, setClimbingSectorId]   = useState<number | null>(null)
  const [availableSectors, setAvailableSectors]   = useState<{ id: number; name: string }[]>([])
  const [loadingSectors, setLoadingSectors]       = useState(false)
  const [climbingRoute, setClimbingRoute]         = useState<ClimbingRouteForm>(
    { name: "", grade: "", type: "", length_m: "", bolts: "", description: "" }
  )

  // Trekking mode states
  const [trekkingMode, setTrekkingMode]                 = useState<TrekkingMode>(null)
  const [trekkingSpotId, setTrekkingSpotId]             = useState<number | null>(null)
  const [availableTrekkingSpots, setAvailableTrekkingSpots] = useState<{ id: number; name: string }[]>([])
  const [loadingTrekkingSpots, setLoadingTrekkingSpots] = useState(false)

  useEffect(() => {
    if (!submitting) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [submitting])

  const isService  = selectedCat?.name === "Surf" || selectedCat?.name === "Kayak"
  const isTrekking = selectedCat?.name === "Trekking"
  const isEscalada = selectedCat?.name === "Escalada"
  const summaryStep =
    isService && creatingNewSpot ? 5
    : isService ? 4
    : isTrekking && trekkingMode === "new_route" ? 5
    : isTrekking ? 6
    : isEscalada && climbingMode === "new_sector" ? 4
    : 5

  function upd(field: string, val: string) {
    setBasic(prev => ({ ...prev, [field]: val }))
  }

  function toggleAmenity(name: string) {
    setSelectedAmenities(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  async function handleCategorySelect(cat: Category) {
    setSelectedCat(cat)
    const isServ = cat.name === "Surf" || cat.name === "Kayak"
    if (isServ) {
      setLoadingSpots(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots?activity=${cat.name}`)
        const data = await res.json()
        setAvailableSpots(data.map((sp: { id: number; name: string }) => ({ id: sp.id, name: sp.name })))
      } catch {
        // proceed with empty list if fetch fails
      } finally {
        setLoadingSpots(false)
      }
    }
    setStep(2)
  }

  async function handleTrekkingModeSelect(mode: "new_spot" | "new_route") {
    setTrekkingMode(mode)
    if (mode === "new_route") {
      setLoadingTrekkingSpots(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots?activity=Trekking`)
        const data = await res.json()
        setAvailableTrekkingSpots(data.map((sp: { id: number; name: string }) => ({ id: sp.id, name: sp.name })))
      } catch {} finally {
        setLoadingTrekkingSpots(false)
      }
    }
  }

  async function handleClimbingModeSelect(mode: "new_spot" | "new_sector" | "new_route") {
    setClimbingMode(mode)
    if (mode === "new_sector" || mode === "new_route") {
      setLoadingSpots(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots?activity=Escalada`)
        const data = await res.json()
        setAvailableSpots(data.map((sp: { id: number; name: string }) => ({ id: sp.id, name: sp.name })))
      } catch {
        // proceed with empty list
      } finally {
        setLoadingSpots(false)
      }
    }
  }

  async function goToStep3() {
    if (isService) {
      if (creatingNewSpot) {
        if (basic.email.trim() && !isValidEmail(basic.email)) {
          setError("El email del lugar tiene un formato inválido.")
          return
        }
        if (!basic.name || !basic.description || !basic.department) {
          setError("Completá los campos obligatorios.")
          return
        }
        if (isPublic === null) {
          setError("Indicá si el lugar es público o privado.")
          return
        }
        setError(null)
        setStep(3)
        return
      }
      if (!selectedSpotId) {
        setError("Seleccioná un lugar para continuar.")
        return
      }
      setError(null)
      setStep(3)
      return
    }
    if (basic.email.trim() && !isValidEmail(basic.email)) {
      setError("El email del lugar tiene un formato inválido.")
      return
    }
    if (!basic.name || !basic.description || !basic.department) {
      setError("Completá los campos obligatorios.")
      return
    }
    if (isPublic === null) {
      setError("Indicá si el lugar es público o privado.")
      return
    }
    setError(null)
    setStep(3)
  }

  async function handleSpotImagesAndNext() {
    if (images.length === 0) { setError("Debés subir al menos una imagen."); return }
    setError(null)
    setStep(4)
  }

  function goToStep4() {
    if (isTrekking) {
      const missing = REQUIRED_FEATURE_KEYS.filter(k => trekkingFeatures[k] === null)
      if (missing.length > 0) {
        setFeatureErrors(new Set(missing))
        setError("Completá todas las características obligatorias antes de continuar.")
        return
      }
      setFeatureErrors(new Set())
    }
    if (isEscalada && climbingMode === "new_sector" && !sectors[0]?.name?.trim()) {
      setError("El nombre del sector es obligatorio.")
      return
    }
    setError(null)
    setStep(4)
  }

  async function goToClimbingStep3() {
    if (!climbingSpotId) {
      setError("Seleccioná un spot para continuar.")
      return
    }
    setError(null)
    if (climbingMode === "new_route") {
      setLoadingSectors(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectors?spot_id=${climbingSpotId}`)
        const data = await res.json()
        setAvailableSectors(data.map((sec: { id: number; name: string }) => ({ id: sec.id, name: sec.name })))
      } catch {
        // proceed with empty list
      } finally {
        setLoadingSectors(false)
      }
    }
    setStep(3)
  }

  function goToClimbingStep4() {
    if (!climbingSectorId) {
      setError("Seleccioná un sector para continuar.")
      return
    }
    setError(null)
    setStep(4)
  }

  function goToClimbingStep5() {
    if (!climbingRoute.name.trim()) {
      setError("El nombre de la ruta es obligatorio.")
      return
    }
    setError(null)
    setStep(5)
  }

  async function handleSubmit() {
    if (isTrekking && trekkingMode === "new_route") {
      setSubmitting(true)
      setError(null)
      try {
        for (const r of routes) {
          if (!r.name) continue
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/routes/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              spot_id: trekkingSpotId,
              name: r.name,
              distance_km: r.distance_km ? parseFloat(r.distance_km) : null,
              duration_hours: r.duration_hours ? parseFloat(r.duration_hours) : null,
              elevation_gain: r.elevation_gain ? parseInt(r.elevation_gain) : null,
              elevation_loss: r.elevation_loss ? parseInt(r.elevation_loss) : null,
              max_altitude: r.max_altitude ? parseInt(r.max_altitude) : null,
              min_altitude: r.min_altitude ? parseInt(r.min_altitude) : null,
              difficulty: r.difficulty || null,
              route_type: r.route_type || null,
              technical_level: r.technical_level || null,
              physical_demand: r.physical_demand || null,
            }),
          })
        }
        setSuccess(true)
      } catch {
        setError("No se pudo guardar la ruta. Intentá de nuevo.")
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (isEscalada && climbingMode === "new_sector") {
      setSubmitting(true)
      setError(null)
      try {
        const sec = sectors[0]
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectors/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: sec.name,
            type: sec.type || null,
            max_altitude: sec.max_altitude ? parseInt(sec.max_altitude) : null,
            restrictions: sec.restrictions || null,
            spot_id: climbingSpotId,
          }),
        })
        if (!res.ok) throw new Error()
        setSuccess(true)
      } catch {
        setError("No se pudo guardar el sector. Intentá de nuevo.")
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (isEscalada && climbingMode === "new_route") {
      setSubmitting(true)
      setError(null)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/climbingroutes/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: climbingRoute.name,
            grade: climbingRoute.grade || null,
            type: climbingRoute.type || null,
            length: climbingRoute.length_m ? parseInt(climbingRoute.length_m) : null,
            bolts: climbingRoute.bolts ? parseInt(climbingRoute.bolts) : null,
            description: climbingRoute.description || null,
            sector_id: climbingSectorId,
          }),
        })
        if (!res.ok) throw new Error()
        setSuccess(true)
      } catch {
        setError("No se pudo guardar la ruta. Intentá de nuevo.")
      } finally {
        setSubmitting(false)
      }
      return
    }

    await submitAgregarLugar({
      selectedCat: selectedCat!,
      isService: isService ?? false,
      creatingNewSpot,
      token,
      basic,
      isPublic,
      publicTransport,
      selectedAmenities,
      trekkingFeatures,
      routes,
      sectors,
      surf,
      kayaks,
      images,
      surfPhotoFiles,
      kayakPhotoFiles,
      selectedSpotId,
      ownerEmail: session?.user?.email ?? null,
      setSubmitting,
      setUploadProgress,
      setError,
      setSuccess,
    })
  }

  function reset() {
    setStep(1); setSelectedCat(null); setBasic(emptyBasic())
    setSelectedAmenities([]); setRoutes([defaultRoute()]); setSectors([defaultSector()])
    setTrekkingFeatures(defaultTrekkingFeatures())
    setSurf(defaultSurf()); setKayaks([defaultKayak()])
    setImages([]); setPreviews([])
    setSurfPhotoFiles([null, null, null]); setSurfPhotoPreviews([null, null, null])
    setKayakPhotoFiles([null, null, null]); setKayakPhotoPreviews([null, null, null])
    setFeatureErrors(new Set()); setError(null); setSuccess(false)
    setSelectedSpotId(null); setAvailableSpots([])
    setIsPublic(null); setPublicTransport(null)
    setCreatingNewSpot(false); setClimbingMode(null)
    setClimbingSpotId(null); setClimbingSectorId(null)
    setAvailableSectors([]); setLoadingSectors(false)
    setClimbingRoute({ name: "", grade: "", type: "", length_m: "", bolts: "", description: "" })
    setTrekkingMode(null); setTrekkingSpotId(null)
    setAvailableTrekkingSpots([]); setLoadingTrekkingSpots(false)
  }

  const pageHeader = (
    <div style={{
      background: "linear-gradient(160deg, #1b4332 0%, #2d6a4f 65%, #40916c 100%)",
      borderRadius: 20,
      padding: "24px 28px",
      marginBottom: 28,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>

        {step > 1 && (
          <button
            type="button"
            onClick={reset}
            style={{ background: "none", border: "none", fontSize: 13, color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", padding: 0 }}
          >
            Empezar de cero
          </button>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, justifyContent: "center" }}>
        <img src="/RumboLogo.png" alt="Rumbo" style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 8 }} />
        <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "var(--font-nunito)" }}>rumbo</span>
      </div>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", maxWidth: 480, margin: "0 auto", lineHeight: 1.5, textAlign: "center" }}>
        Completá este formulario para agregar tu lugar a la plataforma. Revisaremos la información antes de publicarlo.
      </p>
    </div>
  )

  if (!session) {
    return (
      <div style={s.page}>
        <style>{mediaQuery}</style>
        <div style={{ ...s.container, textAlign: "center", paddingTop: 48 }}>
          {pageHeader}
          <div style={{
            background: "#fff", border: "1px solid #e0ddd6", borderRadius: 20,
            padding: "32px 28px", marginTop: 32, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#1b1b19", marginBottom: 8 }}>
              Necesitás una cuenta para continuar
            </p>
            <p style={{ fontSize: 14, color: "#7a7669", marginBottom: 28, lineHeight: 1.6, maxWidth: 380, margin: "0 auto 28px" }}>
              Guardamos tu email para poder contactarte si necesitamos verificar o completar la información del lugar que enviás.
            </p>
            <button
              onClick={() => signIn("google", { callbackUrl: "/agregar-lugar" })}
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "#fff", border: "1px solid #e0ddd6", borderRadius: 12,
                padding: "12px 24px", fontSize: 15, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", color: "#1b1b19",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              Continuar con Google
            </button>
            <p style={{ fontSize: 12, color: "#9a9690", marginTop: 20 }}>
              Al continuar aceptás nuestros{" "}
              <a href="/legal/terms" style={{ color: "#2d6a4f" }}>Términos y condiciones</a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={s.page}>
        <style>{mediaQuery}</style>
        <div style={{ ...s.container, textAlign: "center", paddingTop: 32 }}>
          {pageHeader}
          <div style={{ marginTop: 48 }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#1b1b19", marginBottom: 8 }}>¡Gracias!</p>
            <p style={{ fontSize: 16, color: "#7a7669", marginBottom: 36 }}>Tu lugar fue enviado y será revisado pronto.</p>
            <button style={s.btnPrimary} onClick={reset}>Enviar otro lugar</button>
          </div>
        </div>
      </div>
    )
  }

  const climbingSpotName  = availableSpots.find(sp => sp.id === climbingSpotId)?.name
  const climbingSectorName = availableSectors.find(sec => sec.id === climbingSectorId)?.name

  return (
    <div style={s.page}>
      <style>{mediaQuery}</style>
      <div style={s.container}>
        {pageHeader}

        {step === 1 && (
          <StepCategoria onSelect={handleCategorySelect} />
        )}

        {/* Surf/Kayak: selector de spot existente */}
        {step === 2 && isService && !creatingNewSpot && (
          <StepServicioSpot
            selectedCat={selectedCat!}
            availableSpots={availableSpots}
            loadingSpots={loadingSpots}
            selectedSpotId={selectedSpotId}
            setSelectedSpotId={setSelectedSpotId}
            setCreatingNewSpot={setCreatingNewSpot}
            error={error}
            onBack={() => { setStep(1); setSelectedSpotId(null); setAvailableSpots([]) }}
            onNext={goToStep3}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {/* Surf/Kayak: crear nuevo spot */}
        {step === 2 && isService && creatingNewSpot && (
          <StepInfoBasica
            title={selectedCat?.name === "Surf" ? "Datos de la playa" : "Datos del río/laguna"}
            basic={basic}
            setBasic={setBasic}
            upd={upd}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
            publicTransport={publicTransport}
            setPublicTransport={setPublicTransport}
            error={error}
            onBack={() => setCreatingNewSpot(false)}
            onNext={goToStep3}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {/* Escalada: selector de modo */}
        {step === 2 && isEscalada && climbingMode === null && (
          <StepClimbingMode
            onSelect={handleClimbingModeSelect}
            onBack={() => setStep(1)}
          />
        )}

        {/* Escalada new_spot: formulario info básica */}
        {step === 2 && isEscalada && climbingMode === "new_spot" && (
          <StepInfoBasica
            basic={basic}
            setBasic={setBasic}
            upd={upd}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
            publicTransport={publicTransport}
            setPublicTransport={setPublicTransport}
            error={error}
            onBack={() => setClimbingMode(null)}
            onNext={goToStep3}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {/* Escalada new_sector/new_route: selector de spot existente */}
        {step === 2 && isEscalada && (climbingMode === "new_sector" || climbingMode === "new_route") && (
          <StepClimbingSpotSelector
            availableSpots={availableSpots}
            loadingSpots={loadingSpots}
            selectedSpotId={climbingSpotId}
            setSelectedSpotId={setClimbingSpotId}
            error={error}
            onBack={() => { setClimbingMode(null); setClimbingSpotId(null) }}
            onNext={goToClimbingStep3}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {/* Trekking: selector de modo */}
        {step === 2 && isTrekking && trekkingMode === null && (
          <StepTrekkingMode
            onSelect={handleTrekkingModeSelect}
            onBack={() => setStep(1)}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {/* Trekking new_spot: info básica */}
        {step === 2 && isTrekking && trekkingMode === "new_spot" && (
          <StepInfoBasica
            basic={basic}
            setBasic={setBasic}
            upd={upd}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
            publicTransport={publicTransport}
            setPublicTransport={setPublicTransport}
            error={error}
            onBack={() => setTrekkingMode(null)}
            onNext={goToStep3}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {/* Trekking new_route: selector de spot */}
        {step === 2 && isTrekking && trekkingMode === "new_route" && (
          <StepTrekkingSpotSelector
            availableSpots={availableTrekkingSpots}
            loadingSpots={loadingTrekkingSpots}
            selectedSpotId={trekkingSpotId}
            setSelectedSpotId={setTrekkingSpotId}
            error={error}
            onBack={() => { setTrekkingMode(null); setTrekkingSpotId(null) }}
            onNext={() => {
              if (!trekkingSpotId) { setError("Seleccioná un spot para continuar."); return }
              setError(null); setStep(3)
            }}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {/* Otras categorías: info básica */}
        {step === 2 && !isService && !isEscalada && !isTrekking && (
          <StepInfoBasica
            basic={basic}
            setBasic={setBasic}
            upd={upd}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
            publicTransport={publicTransport}
            setPublicTransport={setPublicTransport}
            error={error}
            onBack={() => setStep(1)}
            onNext={goToStep3}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {step === 3 && (selectedCat?.name === "Camping" || selectedCat?.name === "Glamping") && (
          <StepAmenities
            selectedCat={selectedCat!}
            selectedAmenities={selectedAmenities}
            toggleAmenity={toggleAmenity}
            error={error}
            onBack={() => setStep(2)}
            onNext={goToStep4}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {step === 3 && isTrekking && trekkingMode !== "new_route" && (
          <StepTrekkingCaracteristicas
            trekkingFeatures={trekkingFeatures}
            setTrekkingFeatures={setTrekkingFeatures}
            featureErrors={featureErrors}
            setFeatureErrors={setFeatureErrors}
            error={error}
            onBack={() => setStep(2)}
            onNext={goToStep4}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {step === 3 && isTrekking && trekkingMode === "new_route" && (
          <StepRutas
            routes={routes}
            setRoutes={setRoutes}
            onBack={() => setStep(2)}
            onNext={() => setStep(summaryStep)}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {/* Escalada new_spot: sectores completos */}
        {step === 3 && isEscalada && (!climbingMode || climbingMode === "new_spot") && (
          <StepEscalada
            sectors={sectors}
            setSectors={setSectors}
            error={error}
            onBack={() => setStep(2)}
            onNext={goToStep4}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {/* Escalada new_sector: formulario de un sector */}
        {step === 3 && isEscalada && climbingMode === "new_sector" && (
          <StepClimbingSectorForm
            sectors={sectors}
            setSectors={setSectors}
            error={error}
            onBack={() => setStep(2)}
            onNext={goToStep4}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {/* Escalada new_route: selector de sector */}
        {step === 3 && isEscalada && climbingMode === "new_route" && (
          <StepClimbingSectorSelector
            availableSectors={availableSectors}
            loadingSectors={loadingSectors}
            selectedSectorId={climbingSectorId}
            setSelectedSectorId={setClimbingSectorId}
            error={error}
            onBack={() => { setStep(2); setClimbingSectorId(null); setAvailableSectors([]) }}
            onNext={goToClimbingStep4}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {step === 3 && selectedCat?.name === "Surf" && !creatingNewSpot && (
          <StepSurf
            surf={surf}
            setSurf={setSurf}
            surfPhotoFiles={surfPhotoFiles}
            setSurfPhotoFiles={setSurfPhotoFiles}
            surfPhotoPreviews={surfPhotoPreviews}
            setSurfPhotoPreviews={setSurfPhotoPreviews}
            error={error}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {step === 3 && selectedCat?.name === "Kayak" && !creatingNewSpot && (
          <StepKayak
            kayaks={kayaks}
            setKayaks={setKayaks}
            kayakPhotoFiles={kayakPhotoFiles}
            setKayakPhotoFiles={setKayakPhotoFiles}
            kayakPhotoPreviews={kayakPhotoPreviews}
            setKayakPhotoPreviews={setKayakPhotoPreviews}
            error={error}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {step === 3 && isService && creatingNewSpot && (
          <StepImagenes
            images={images}
            setImages={setImages}
            previews={previews}
            setPreviews={setPreviews}
            setError={setError}
            error={error}
            onBack={() => setStep(2)}
            onNext={handleSpotImagesAndNext}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {step === 4 && isService && creatingNewSpot && selectedCat?.name === "Surf" && (
          <StepSurf
            surf={surf}
            setSurf={setSurf}
            surfPhotoFiles={surfPhotoFiles}
            setSurfPhotoFiles={setSurfPhotoFiles}
            surfPhotoPreviews={surfPhotoPreviews}
            setSurfPhotoPreviews={setSurfPhotoPreviews}
            error={error}
            optional={true}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
            onSkip={() => setStep(5)}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {step === 4 && isService && creatingNewSpot && selectedCat?.name === "Kayak" && (
          <StepKayak
            kayaks={kayaks}
            setKayaks={setKayaks}
            kayakPhotoFiles={kayakPhotoFiles}
            setKayakPhotoFiles={setKayakPhotoFiles}
            kayakPhotoPreviews={kayakPhotoPreviews}
            setKayakPhotoPreviews={setKayakPhotoPreviews}
            error={error}
            optional={true}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
            onSkip={() => setStep(5)}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {step === 4 && isTrekking && trekkingMode !== "new_route" && (
          <StepRutas
            routes={routes}
            setRoutes={setRoutes}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {/* Escalada new_route: formulario de ruta */}
        {step === 4 && isEscalada && climbingMode === "new_route" && (
          <StepClimbingRouteForm
            route={climbingRoute}
            setRoute={setClimbingRoute}
            error={error}
            onBack={() => setStep(3)}
            onNext={goToClimbingStep5}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {/* Imágenes: no aplica para escalada new_sector/new_route */}
        {step === (isTrekking ? 5 : 4) && !isService && (!isEscalada || climbingMode === "new_spot") && (
          <StepImagenes
            images={images}
            setImages={setImages}
            previews={previews}
            setPreviews={setPreviews}
            setError={setError}
            error={error}
            onBack={() => setStep(isTrekking ? 4 : 3)}
            onNext={() => setStep(summaryStep)}
            stepLabel={`Paso ${step} de ${summaryStep}`}
          />
        )}

        {submitting && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <div style={{
              background: "#fff", borderRadius: 20, padding: "36px 40px",
              maxWidth: 380, width: "90%", textAlign: "center",
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                border: "4px solid #e0ddd6",
                borderTopColor: "#2d6a4f",
                margin: "0 auto 20px",
                animation: "spin 0.9s linear infinite",
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#1b1b19", margin: "0 0 8px" }}>
                Enviando tu lugar...
              </p>
              <p style={{ fontSize: 13, color: "#7a7669", margin: "0 0 16px", lineHeight: 1.5 }}>
                {uploadProgress ?? "Procesando..."}
              </p>
              <div style={{
                background: "#fef3cd", border: "1px solid #f0d98a",
                borderRadius: 10, padding: "10px 14px",
                fontSize: 12, color: "#78590a", lineHeight: 1.5,
              }}>
                ⚠️ No cierres esta página hasta que termine el proceso.
              </div>
            </div>
          </div>
        )}

        {step === summaryStep && (
          <StepResumen
            selectedCat={selectedCat!}
            isService={isService ?? false}
            isTrekking={isTrekking ?? false}
            basic={basic}
            trekkingFeatures={trekkingFeatures}
            routes={routes}
            surf={surf}
            kayaks={kayaks}
            availableSpots={availableSpots}
            selectedSpotId={selectedSpotId}
            submitting={submitting}
            uploadProgress={uploadProgress}
            error={error}
            onSubmit={handleSubmit}
            onBack={() => setStep(
              isService && creatingNewSpot ? 4
              : isService ? 3
              : isTrekking && trekkingMode === "new_route" ? 3
              : isTrekking ? 5
              : isEscalada && climbingMode === "new_sector" ? 3
              : 4
            )}
            onEditStep={setStep}
            climbingMode={climbingMode}
            climbingSpotName={climbingSpotName}
            climbingSectorName={climbingSectorName}
            sectors={sectors}
            climbingRoute={climbingRoute}
          />
        )}
      </div>
    </div>
  )
}
