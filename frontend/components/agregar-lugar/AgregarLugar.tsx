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
import type { Category, TrekkingFeatures, TrekkingFeatureKey, RouteItem, SectorItem, SurfItem, KayakItem, BasicInfo } from "./types"

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

  const isService  = selectedCat?.name === "Surf" || selectedCat?.name === "Kayak"
  const isTrekking = selectedCat?.name === "Trekking"
  const summaryStep = isService ? 4 : isTrekking ? 6 : 5

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

  function goToStep3() {
    if (isService) {
      if (!selectedSpotId) {
        setError("Seleccioná un lugar para continuar.")
        return
      }
      setError(null)
      setStep(3)
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
    setError(null)
    setStep(4)
  }

  async function handleSubmit() {
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

  return (
    <div style={s.page}>
      <style>{mediaQuery}</style>
      <div style={s.container}>
        {pageHeader}
        <p style={{ fontSize: 13, color: "#7a7669", marginBottom: 28, textAlign: "center" }}>Paso {step} de {summaryStep}</p>

        {step === 1 && (
          <StepCategoria onSelect={handleCategorySelect} />
        )}

        {step === 2 && isService && (
          <StepServicioSpot
            selectedCat={selectedCat!}
            availableSpots={availableSpots}
            loadingSpots={loadingSpots}
            selectedSpotId={selectedSpotId}
            setSelectedSpotId={setSelectedSpotId}
            error={error}
            onBack={() => { setStep(1); setSelectedSpotId(null); setAvailableSpots([]) }}
            onNext={goToStep3}
          />
        )}

        {step === 2 && !isService && (
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

        {step === 3 && selectedCat?.name === "Escalada" && (
          <StepEscalada
            sectors={sectors}
            setSectors={setSectors}
            error={error}
            onBack={() => setStep(2)}
            onNext={goToStep4}
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

        {step === (isTrekking ? 5 : 4) && !isService && (
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
            onBack={() => setStep(isService ? 3 : isTrekking ? 5 : 4)}
            onEditStep={setStep}
          />
        )}
      </div>
    </div>
  )
}
