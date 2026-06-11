"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { s, mediaQuery } from "./styles"
import {
  defaultTrekkingFeatures, defaultRoute, defaultSector, defaultSurf, defaultKayak, emptyBasic,
  REQUIRED_FEATURE_KEYS,
} from "./constants"
import { submitAgregarLugar } from "./submit"
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
import type {
  Category, TrekkingFeatures, TrekkingFeatureKey, RouteItem, SectorItem,
  SurfItem, KayakItem, BasicInfo, ClimbingMode, ClimbingRouteForm,
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
  const [contactError, setContactError]           = useState<string | null>(null)
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

  const isService  = selectedCat?.name === "Surf" || selectedCat?.name === "Kayak"
  const isTrekking = selectedCat?.name === "Trekking"
  const isEscalada = selectedCat?.name === "Escalada"
  const summaryStep = isService ? 4 : isTrekking ? 6 : isEscalada && climbingMode === "new_sector" ? 4 : 5

  function upd(field: string, val: string) {
    setBasic(prev => ({ ...prev, [field]: val }))
    if ((field === "email" || field === "whatsapp" || field === "instagram") && val.trim()) {
      setContactError(null)
    }
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
        const hasContact = basic.owner_contact_type === "email" ? !!basic.owner_email : !!basic.owner_phone
        if (!hasContact || !basic.name || !basic.description || !basic.department) {
          setError("Completá los campos obligatorios.")
          return
        }
        if (isPublic === null) {
          setError("Indicá si el lugar es público o privado.")
          return
        }
        if (!basic.email.trim() && !basic.whatsapp.trim() && !basic.instagram.trim()) {
          setContactError("Ingresá al menos un medio de contacto.")
          return
        }
        setContactError(null)
        setError(null)
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              name: basic.name,
              description: basic.description,
              department: basic.department,
              category_id: selectedCat!.id,
              email: basic.email || null,
              whatsapp: basic.whatsapp || null,
              instagram: basic.instagram || null,
              price: basic.price ? parseInt(basic.price) : null,
              lat: basic.lat ? parseFloat(basic.lat) : null,
              lng: basic.lng ? parseFloat(basic.lng) : null,
              owner_email: basic.owner_contact_type === "email" ? basic.owner_email : null,
              owner_phone: basic.owner_contact_type === "phone" ? basic.owner_phone : null,
              is_public: isPublic,
              public_transport: publicTransport,
              season_start: basic.season_type === "seasonal" && basic.season_start ? parseInt(basic.season_start) : null,
              season_end: basic.season_type === "seasonal" && basic.season_end ? parseInt(basic.season_end) : null,
            }),
          })
          if (!res.ok) {
            setError("No se pudo crear el lugar. Intentá de nuevo.")
            return
          }
          const data = await res.json()
          setSelectedSpotId(data.id)
          setStep(3)
        } catch {
          setError("No se pudo crear el lugar. Intentá de nuevo.")
        }
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
    const hasContact = basic.owner_contact_type === "email" ? !!basic.owner_email : !!basic.owner_phone
    if (!hasContact || !basic.name || !basic.description || !basic.department) {
      setError("Completá los campos obligatorios.")
      return
    }
    if (isPublic === null) {
      setError("Indicá si el lugar es público o privado.")
      return
    }
    if (!basic.email.trim() && !basic.whatsapp.trim() && !basic.instagram.trim()) {
      setContactError("Ingresá al menos un medio de contacto.")
      return
    }
    setContactError(null)
    setError(null)
    setStep(3)
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
    setContactError(null); setFeatureErrors(new Set()); setError(null); setSuccess(false)
    setSelectedSpotId(null); setAvailableSpots([])
    setIsPublic(null); setPublicTransport(null)
    setCreatingNewSpot(false); setClimbingMode(null)
    setClimbingSpotId(null); setClimbingSectorId(null)
    setAvailableSectors([]); setLoadingSectors(false)
    setClimbingRoute({ name: "", grade: "", type: "", length_m: "", bolts: "", description: "" })
  }

  const pageHeader = (
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <img src="/RumboLogo.png" alt="Rumbo" style={{ width: 36, height: 36, objectFit: "contain" }} />
        <span style={{ fontSize: 22, fontWeight: 700, color: "#1b1b19" }}>Rumbo</span>
      </div>
      <p style={{ fontSize: 13, color: "#7a7669", maxWidth: 480, margin: "0 auto", lineHeight: 1.5 }}>
        Completá este formulario para agregar tu lugar a la plataforma. Revisaremos la información antes de publicarlo.
      </p>
    </div>
  )

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
        <p style={{ fontSize: 13, color: "#7a7669", marginBottom: 28, textAlign: "center" }}>Paso {step} de {summaryStep}</p>

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
            contactError={contactError}
            error={error}
            onBack={() => setCreatingNewSpot(false)}
            onNext={goToStep3}
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
            contactError={contactError}
            error={error}
            onBack={() => setClimbingMode(null)}
            onNext={goToStep3}
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
          />
        )}

        {/* Otras categorías: info básica */}
        {step === 2 && !isService && !isEscalada && (
          <StepInfoBasica
            basic={basic}
            setBasic={setBasic}
            upd={upd}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
            publicTransport={publicTransport}
            setPublicTransport={setPublicTransport}
            contactError={contactError}
            error={error}
            onBack={() => setStep(1)}
            onNext={goToStep3}
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
          />
        )}

        {step === 3 && selectedCat?.name === "Trekking" && (
          <StepTrekkingCaracteristicas
            trekkingFeatures={trekkingFeatures}
            setTrekkingFeatures={setTrekkingFeatures}
            featureErrors={featureErrors}
            setFeatureErrors={setFeatureErrors}
            error={error}
            onBack={() => setStep(2)}
            onNext={goToStep4}
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
          />
        )}

        {step === 3 && selectedCat?.name === "Surf" && (
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
          />
        )}

        {step === 3 && selectedCat?.name === "Kayak" && (
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
          />
        )}

        {step === 4 && isTrekking && (
          <StepRutas
            routes={routes}
            setRoutes={setRoutes}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
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
          />
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
              isService ? 3
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
