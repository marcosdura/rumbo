"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { signInWithGoogle } from "@/lib/auth"
import { s, mediaQuery } from "./styles"
import {
  defaultTrekkingFeatures, defaultRoute, defaultSector, defaultSurf, defaultKayak, emptyBasic,
  REQUIRED_FEATURE_KEYS, defaultMotorhomeDetail, defaultCampingDetail, defaultGlampingDetail,
  defaultClimbingRouteItem, CATEGORIES,
} from "./constants"
import { submitAgregarLugar, submitNewTrekkingRoute, submitNewClimbingSector, submitNewClimbingRoute, type Failure } from "./submit"
import FailuresNotice from "./FailuresNotice"
import { trackEvent } from "@/lib/analytics"
import { api } from "@/lib/api"
import { RESULT_COPY, mySpotsFor, type MySpot, type SubmitResult } from "./result"
import { parsePrefill, prefillIntro, PREFILL_AGAIN, PREFILL_CATEGORY, type PrefillKind } from "./prefill"
import {
  ENTRY_STEP, canEdit, createsSpot, flowSteps, isComplete, nextStep, previousStep, stepLabel, stepProgress, type StepKey,
} from "./flow"
import Link from "next/link"
import type { PickableSpot } from "@/components/forms/spotSearch"
import AgregarLugarHeader from "./AgregarLugarHeader"
import SubmittingOverlay from "@/components/ui/SubmittingOverlay"
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
import StepTrekkingMode from "./steps/StepTrekkingMode"
import StepTrekkingSpotSelector from "./steps/StepTrekkingSpotSelector"
import StepCategoriasAdicionales from "./steps/StepCategoriasAdicionales"
import StepMotorhomeDetalle from "./steps/StepMotorhomeDetalle"
import StepGlampingUnidades from "./steps/StepGlampingUnidades"
import StepClimbingRoutes from "./steps/StepClimbingRoutes"
import StepExperiencias from "./steps/StepExperiencias"
import type {
  Category, TrekkingFeatures, TrekkingFeatureKey, RouteItem, SectorItem,
  SurfItem, KayakItem, BasicInfo, ClimbingMode, TrekkingMode,
  MotorhomeDetailItem, CampingDetailItem, GlampingDetailItem, ClimbingRouteItem, ExperienceItem,
} from "./types"

type Option = { id: number; name: string }
type PrefillSpot = { id: number; name: string; slug: string | null }
// Lo que fija un link directo (?sumar=...): qué se suma y a qué lugar (y
// sector). Se guarda para que "Empezar de cero" y "Sumar otra" vuelvan al
// mismo formulario puntual.
type Locked = { kind: PrefillKind; spot: PrefillSpot; sector: Option | null }

export default function AgregarLugar() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const token = session?.id_token

  const [step, setStep]                           = useState<StepKey>("categoria")
  const [selectedCat, setSelectedCat]             = useState<Category | null>(null)
  const [basic, setBasic]                         = useState<BasicInfo>(emptyBasic())
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [additionalCategories, setAdditionalCategories] = useState<string[]>([])
  const [motorhomeDetail, setMotorhomeDetail]     = useState<MotorhomeDetailItem>(defaultMotorhomeDetail())
  const [campingDetail, setCampingDetail]         = useState<CampingDetailItem>(defaultCampingDetail())
  const [glampingDetail, setGlampingDetail]       = useState<GlampingDetailItem>(defaultGlampingDetail())
  const [glampingUnits, setGlampingUnits]         = useState<GlampingDetailItem[]>([defaultGlampingDetail()])
  const [selectedGlampingAmenities, setSelectedGlampingAmenities] = useState<string[]>([])
  const [selectedCampingAmenities, setSelectedCampingAmenities]   = useState<string[]>([])
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
  // ¿Quien lo carga es el responsable o dueño, o un visitante?
  const [isResponsible, setIsResponsible]         = useState<boolean | null>(null)
  const [publicTransport, setPublicTransport]     = useState<string | null>(null)
  const [featureErrors, setFeatureErrors]         = useState<Set<TrekkingFeatureKey>>(new Set())
  const [submitting, setSubmitting]               = useState(false)
  const [uploadProgress, setUploadProgress]       = useState<string | null>(null)
  const [error, setError]                         = useState<string | null>(null)
  const [success, setSuccess]                     = useState<SubmitResult | null>(null)
  // Partes que no se pudieron guardar después de crear el lugar o el sector.
  const [failures, setFailures]                   = useState<Failure[]>([])
  const [selectedSpotId, setSelectedSpotId]       = useState<number | null>(null)
  const [availableSpots, setAvailableSpots]       = useState<PickableSpot[]>([])
  const [loadingSpots, setLoadingSpots]           = useState(false)

  // Climbing & service-spot creation states
  const [climbingMode, setClimbingMode]           = useState<ClimbingMode>(null)
  const [creatingNewSpot, setCreatingNewSpot]     = useState(false)
  const [climbingSpotId, setClimbingSpotId]       = useState<number | null>(null)
  const [climbingSectorId, setClimbingSectorId]   = useState<number | null>(null)
  const [availableSectors, setAvailableSectors]   = useState<Option[]>([])
  const [loadingSectors, setLoadingSectors]       = useState(false)
  const [climbingNewRoutes, setClimbingNewRoutes] = useState<ClimbingRouteItem[]>([defaultClimbingRouteItem(0)])
  const [sectorRoutes, setSectorRoutes]           = useState<ClimbingRouteItem[]>([])

  // Trekking mode states
  const [trekkingMode, setTrekkingMode]                 = useState<TrekkingMode>(null)
  const [trekkingSpotId, setTrekkingSpotId]             = useState<number | null>(null)
  const [availableTrekkingSpots, setAvailableTrekkingSpots] = useState<Option[]>([])
  const [loadingTrekkingSpots, setLoadingTrekkingSpots] = useState(false)

  const [experiences, setExperiences]                   = useState<ExperienceItem[]>([])

  // Llegada por link directo (?sumar=sector&spot=12): el formulario queda
  // fijo en eso (sin volver a elegir categoría, modo ni lugar).
  const [locked, setLocked] = useState<Locked | null>(null)

  useEffect(() => {
    // window.location y no useSearchParams: este último obliga a envolver la
    // página en un <Suspense> para el prerender.
    const prefill = parsePrefill(new URLSearchParams(window.location.search))
    if (!prefill) return
    const { kind, spotId, sectorId } = prefill
    ;(async () => {
      try {
        // /spots/{id} solo devuelve lugares publicados: un link a uno que no
        // existe (o no está aprobado) cae en el catch.
        const { data: spot } = await api.get<PrefillSpot>(`/spots/${spotId}`)
        let sector: Option | null = null
        if (kind === "via") {
          const { data } = await api.get<{ id: number; name: string; spot_id: number }>(`/sectors/${sectorId}`)
          if (data.spot_id !== spot.id) throw new Error("El sector es de otro lugar")
          sector = { id: data.id, name: data.name }
        }
        enterLocked({ kind, spot: { id: spot.id, name: spot.name, slug: spot.slug }, sector })
      } catch {
        setError("No encontramos ese lugar. Podés elegirlo desde el formulario.")
      }
    })()
  }, [])

  // Deja el formulario en el paso de entrada del link directo, con el lugar
  // (y el sector) ya elegidos.
  function enterLocked(lock: Locked) {
    const { kind, spot, sector } = lock
    const cat = CATEGORIES.find(c => c.name === PREFILL_CATEGORY[kind])
    if (!cat) return
    const option = [{ id: spot.id, name: spot.name }]
    setSelectedCat(cat)
    if (kind === "ruta") {
      setTrekkingMode("new_route"); setTrekkingSpotId(spot.id); setAvailableTrekkingSpots(option)
    } else if (kind === "sector" || kind === "via") {
      setClimbingMode(kind === "sector" ? "new_sector" : "new_route"); setClimbingSpotId(spot.id); setAvailableSpots(option)
      if (sector) { setClimbingSectorId(sector.id); setAvailableSectors([sector]) }
    } else {
      setCreatingNewSpot(false); setSelectedSpotId(spot.id); setAvailableSpots(option)
    }
    setLocked(lock)
    setStep(ENTRY_STEP[kind])
  }

  useEffect(() => {
    trackEvent("add_spot_start")
  }, [])

  useEffect(() => {
    if (!submitting) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [submitting])

  useEffect(() => {
    if (!session?.id_token) return
    if (session.termsAcceptedAt) return

    api.patch("/users/me/terms", undefined, { token: session.id_token })
      .then(() => update({ termsAcceptedAt: new Date().toISOString() }))
  }, [session?.id_token])

  const isService  = selectedCat?.name === "Surf" || selectedCat?.name === "Kayak"
  const isTrekking = selectedCat?.name === "Trekking"
  const isEscalada = selectedCat?.name === "Escalada"

  const steps = flowSteps({ category: selectedCat?.name ?? null, climbingMode, trekkingMode, creatingNewSpot })
  const entry = locked ? ENTRY_STEP[locked.kind] : null
  const spotUrl = locked ? (locked.spot.slug ? `/spots/${locked.spot.slug}` : "/") : null

  function goTo(key: StepKey) {
    setError(null)
    setStep(key)
  }

  function goNext() {
    const next = nextStep(steps, step)
    if (next) goTo(next)
  }

  function goBack() {
    const prev = previousStep(steps, step, entry)
    if (prev) {
      // Volver a elegir la playa: ya no se está sugiriendo una nueva.
      if (prev === "lugar" && isService) setCreatingNewSpot(false)
      goTo(prev)
    } else if (spotUrl) {
      // Link directo: el primer paso vuelve al lugar, no a elegir otra cosa.
      router.push(spotUrl)
    }
  }

  // Para los "Editar" del resumen: solo los pasos que se pueden tocar.
  function editTo(key: StepKey): (() => void) | undefined {
    return canEdit(steps, key, entry) ? () => goTo(key) : undefined
  }

  function upd(field: string, val: string) {
    setBasic(prev => ({ ...prev, [field]: val }))
  }

  function toggleAmenity(name: string) {
    setSelectedAmenities(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  function handleCategorySelect(cat: Category) {
    setSelectedCat(cat)
    const isServ = cat.name === "Surf" || cat.name === "Kayak"
    goTo(flowSteps({ category: cat.name, climbingMode, trekkingMode, creatingNewSpot })[1])
    if (isServ) {
      setLoadingSpots(true)
      // Las playas y lagunas son lugares públicos: cualquiera suma su
      // escuela o servicio a cualquiera de ellas (queda en revisión y pasa a
      // ser su dueño). /spots/pins no pagina y trae solo id+name.
      // Con departamento y coordenadas: el selector busca y muestra el mapa.
      api.get<PickableSpot[]>("/spots/pins", { params: { activity: cat.name } })
        .then(({ data }) => setAvailableSpots(data))
        .catch(() => {
          // proceed with empty list if fetch fails
        })
        .finally(() => {
          setLoadingSpots(false)
        })
    }
  }

  async function handleTrekkingModeSelect(mode: "new_spot" | "new_route") {
    setTrekkingMode(mode)
    goTo(mode === "new_route" ? "lugar" : "info")
    if (mode === "new_route") {
      setLoadingTrekkingSpots(true)
      try {
        // Las rutas se suman solo a lugares propios (el backend lo exige).
        const { data } = await api.get<MySpot[]>("/spots/mine", { token })
        setAvailableTrekkingSpots(mySpotsFor(data, "Trekking"))
      } catch {} finally {
        setLoadingTrekkingSpots(false)
      }
    }
  }

  async function handleClimbingModeSelect(mode: "new_spot" | "new_sector" | "new_route") {
    setClimbingMode(mode)
    goTo(mode === "new_spot" ? "info" : "lugar")
    if (mode === "new_sector" || mode === "new_route") {
      setLoadingSpots(true)
      try {
        // Escalada es abierta: cualquiera sugiere sectores y vías en cualquier
        // lugar aprobado (quedan en revisión). /spots/pins no pagina y trae
        // solo id+name.
        const { data } = await api.get<PickableSpot[]>("/spots/pins", { params: { activity: "Escalada" } })
        setAvailableSpots(data)
      } catch {
        // proceed with empty list
      } finally {
        setLoadingSpots(false)
      }
    }
  }

  function nextFromServiceSpot() {
    if (!selectedSpotId) {
      setError("Seleccioná un lugar para continuar.")
      return
    }
    goNext()
  }

  function nextFromTrekkingFeatures() {
    const missing = REQUIRED_FEATURE_KEYS.filter(k => trekkingFeatures[k] === null)
    if (missing.length > 0) {
      setFeatureErrors(new Set(missing))
      setError("Completá todas las características obligatorias antes de continuar.")
      return
    }
    setFeatureErrors(new Set())
    goNext()
  }

  function nextFromNewSector() {
    if (!sectors[0]?.name?.trim()) {
      setError("El nombre del sector es obligatorio.")
      return
    }
    goNext()
  }

  async function nextFromClimbingSpot() {
    if (!climbingSpotId) {
      setError("Seleccioná un lugar para continuar.")
      return
    }
    if (climbingMode === "new_route") {
      setLoadingSectors(true)
      try {
        const { data } = await api.get<Option[]>("/sectors/", { params: { spot_id: climbingSpotId } })
        setAvailableSectors(data.map((sec) => ({ id: sec.id, name: sec.name })))
      } catch (err) {
        console.error("Error al cargar sectores:", err)
      } finally {
        setLoadingSectors(false)
      }
    }
    goNext()
  }

  function nextFromSectorSelector() {
    if (!climbingSectorId) {
      setError("Seleccioná un sector para continuar.")
      return
    }
    goNext()
  }

  async function handleSubmit() {
    if (isTrekking && trekkingMode === "new_route") {
      return submitNewTrekkingRoute({ trekkingSpotId, token, routes, setSubmitting, setError, setSuccess, setFailures })
    }

    if (isEscalada && climbingMode === "new_sector") {
      return submitNewClimbingSector({ climbingSpotId, token, sectors, sectorRoutes, setSubmitting, setError, setSuccess, setFailures })
    }

    if (isEscalada && climbingMode === "new_route") {
      return submitNewClimbingRoute({ climbingSectorId, token, climbingNewRoutes, setSubmitting, setError, setSuccess, setFailures })
    }

    await submitAgregarLugar({
      selectedCat: selectedCat!,
      isService: isService ?? false,
      creatingNewSpot,
      token,
      basic,
      isPublic,
      publicTransport,
      isResponsible: isService ? true : isResponsible !== false,
      selectedAmenities,
      additionalCategories,
      motorhomeDetail,
      campingDetail,
      glampingDetail,
      selectedGlampingAmenities,
      selectedCampingAmenities,
      glampingUnits,
      sectorRoutes,
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
      experiences,
      setSubmitting,
      setUploadProgress,
      setError,
      setSuccess,
      setFailures,
    })
  }

  function reset() {
    setStep("categoria"); setSelectedCat(null); setBasic(emptyBasic())
    setSelectedAmenities([]); setRoutes([defaultRoute()]); setSectors([defaultSector()])
    setAdditionalCategories([]); setMotorhomeDetail(defaultMotorhomeDetail())
    setCampingDetail(defaultCampingDetail()); setGlampingDetail(defaultGlampingDetail())
    setGlampingUnits([defaultGlampingDetail()])
    setSelectedGlampingAmenities([]); setSelectedCampingAmenities([])
    setTrekkingFeatures(defaultTrekkingFeatures())
    setSurf(defaultSurf()); setKayaks([defaultKayak()])
    setImages([]); setPreviews([])
    setSurfPhotoFiles([null, null, null]); setSurfPhotoPreviews([null, null, null])
    setKayakPhotoFiles([null, null, null]); setKayakPhotoPreviews([null, null, null])
    setFeatureErrors(new Set()); setError(null); setSuccess(null); setFailures([])
    setSelectedSpotId(null); setAvailableSpots([])
    setIsPublic(null); setPublicTransport(null); setIsResponsible(null)
    setCreatingNewSpot(false); setClimbingMode(null)
    setClimbingSpotId(null); setClimbingSectorId(null)
    setAvailableSectors([]); setLoadingSectors(false)
    setClimbingNewRoutes([defaultClimbingRouteItem(0)])
    setSectorRoutes([])
    setTrekkingMode(null); setTrekkingSpotId(null)
    setAvailableTrekkingSpots([]); setLoadingTrekkingSpots(false)
    setExperiences([])
    // Con link directo se vuelve a empezar lo mismo, en el mismo lugar.
    if (locked) enterLocked(locked)
  }

  const label = stepLabel(steps, step, entry)
  const pageHeader = (
    <AgregarLugarHeader
      stepLabel={label}
      progress={stepProgress(steps, step, entry, selectedCat?.name ?? null)}
      incomplete={!isComplete(steps)}
      canReset={step !== (entry ?? "categoria")}
      intro={locked ? prefillIntro(locked.kind, locked.spot.name, locked.sector?.name) : undefined}
      onReset={reset}
    />
  )
  // Mismo link que "← Volver al perfil" del dashboard.
  const backToSpot = locked && spotUrl ? (
    <Link href={spotUrl} style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
      ← Volver a {locked.spot.name}
    </Link>
  ) : null

  if (!session) {
    return (
      <div style={s.page}>
        <style>{mediaQuery}</style>
        <div style={{ ...s.container, textAlign: "center", paddingTop: 48 }}>
          {pageHeader}
          <div style={{
            background: "#fff", border: "1px solid var(--border)", borderRadius: 20,
            padding: "32px 28px", marginTop: 32, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#1b1b19", marginBottom: 8 }}>
              Necesitás una cuenta para continuar
            </p>
            <p style={{ fontSize: 14, color: "var(--muted-strong)", marginBottom: 28, lineHeight: 1.6, maxWidth: 380, margin: "0 auto 28px" }}>
              Guardamos tu email para poder contactarte si necesitamos verificar o completar la información del lugar que enviás.
            </p>
            <button
              // Volver a la misma URL: si llegó por un link directo
              // (?sumar=...&spot=...), después del login sigue ahí.
              onClick={() => signInWithGoogle({ callbackUrl: window.location.pathname + window.location.search })}
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "#fff", border: "1px solid var(--border)", borderRadius: 12,
                padding: "12px 24px", fontSize: 15, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", color: "#1b1b19",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              Continuar con Google
            </button>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 20 }}>
              Al continuar aceptás nuestros{" "}
              <a href="/legal" style={{ color: "var(--primary)" }}>Términos y condiciones</a>
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
            <p style={{ fontSize: 28, fontWeight: 700, color: "#1b1b19", marginBottom: 8 }}>{RESULT_COPY[success].title}</p>
            <p style={{ fontSize: 16, color: "var(--muted-strong)", marginBottom: 36, maxWidth: 440, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>{RESULT_COPY[success].text}</p>
            <FailuresNotice failures={failures} onChange={setFailures} />
            {locked && spotUrl ? (
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button style={s.btnSecondary} onClick={reset}>{PREFILL_AGAIN[locked.kind]}</button>
                <Link href={spotUrl} style={{ ...s.btnPrimary, textDecoration: "none" }}>Volver a {locked.spot.name}</Link>
              </div>
            ) : (
              <button style={s.btnPrimary} onClick={reset}>{RESULT_COPY[success].again}</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const climbingSpotName   = availableSpots.find(sp => sp.id === climbingSpotId)?.name
  const climbingSectorName = availableSectors.find(sec => sec.id === climbingSectorId)?.name
  const trekkingSpotName   = availableTrekkingSpots.find(sp => sp.id === trekkingSpotId)?.name

  return (
    <div style={s.page}>
      <style>{mediaQuery}</style>
      <div style={s.container}>
        {pageHeader}
        {backToSpot}
        {step === "categoria" && error && (
          <p style={{ fontSize: 13, color: "var(--danger)", margin: "0 0 12px" }}>{error}</p>
        )}

        {step === "categoria" && (
          <StepCategoria onSelect={handleCategorySelect} />
        )}

        {/* ── ¿Qué querés agregar? ── */}
        {step === "modo" && isTrekking && (
          <StepTrekkingMode onSelect={handleTrekkingModeSelect} onBack={goBack} />
        )}
        {step === "modo" && isEscalada && (
          <StepClimbingMode onSelect={handleClimbingModeSelect} onBack={goBack} />
        )}

        {/* ── Elegir un lugar existente ── */}
        {step === "lugar" && isService && (
          <StepServicioSpot
            selectedCat={selectedCat!}
            availableSpots={availableSpots}
            loadingSpots={loadingSpots}
            selectedSpotId={selectedSpotId}
            setSelectedSpotId={setSelectedSpotId}
            onCreateNew={() => { setCreatingNewSpot(true); goTo("info") }}
            error={error}
            onBack={goBack}
            onNext={nextFromServiceSpot}
          />
        )}
        {step === "lugar" && isTrekking && (
          <StepTrekkingSpotSelector
            availableSpots={availableTrekkingSpots}
            loadingSpots={loadingTrekkingSpots}
            selectedSpotId={trekkingSpotId}
            setSelectedSpotId={setTrekkingSpotId}
            error={error}
            onBack={goBack}
            onNext={() => {
              if (!trekkingSpotId) { setError("Seleccioná un lugar para continuar."); return }
              goNext()
            }}
          />
        )}
        {step === "lugar" && isEscalada && (
          <StepClimbingSpotSelector
            availableSpots={availableSpots}
            loadingSpots={loadingSpots}
            selectedSpotId={climbingSpotId}
            setSelectedSpotId={setClimbingSpotId}
            error={error}
            onBack={goBack}
            onNext={nextFromClimbingSpot}
          />
        )}
        {step === "sector" && (
          <StepClimbingSectorSelector
            availableSectors={availableSectors}
            loadingSectors={loadingSectors}
            selectedSectorId={climbingSectorId}
            setSelectedSectorId={setClimbingSectorId}
            error={error}
            onBack={() => { setClimbingSectorId(null); goBack() }}
            onNext={nextFromSectorSelector}
          />
        )}

        {/* ── Datos del lugar nuevo ── */}
        {step === "info" && (
          <StepInfoBasica
            title={selectedCat?.name === "Surf" ? "Datos de la playa" : selectedCat?.name === "Kayak" ? "Datos del río o laguna" : undefined}
            basic={basic}
            setBasic={setBasic}
            upd={upd}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
            publicTransport={publicTransport}
            setPublicTransport={setPublicTransport}
            // Una playa o laguna nueva siempre pasa al admin: no se pregunta.
            {...(isService ? {} : { isResponsible, setIsResponsible })}
            error={error}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {step === "motorhome" && (
          <StepMotorhomeDetalle
            motorhomeDetail={motorhomeDetail}
            setMotorhomeDetail={setMotorhomeDetail}
            error={error}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {step === "glamping_unidades" && (
          <StepGlampingUnidades
            glampingUnits={glampingUnits}
            setGlampingUnits={setGlampingUnits}
            error={error}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {step === "amenities" && (
          <StepAmenities
            selectedCat={selectedCat!}
            selectedAmenities={selectedAmenities}
            toggleAmenity={toggleAmenity}
            error={error}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {step === "experiencias" && (
          <StepExperiencias
            experiences={experiences}
            setExperiences={setExperiences}
            error={error}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {step === "trekking_caracteristicas" && (
          <StepTrekkingCaracteristicas
            trekkingFeatures={trekkingFeatures}
            setTrekkingFeatures={setTrekkingFeatures}
            featureErrors={featureErrors}
            setFeatureErrors={setFeatureErrors}
            error={error}
            onBack={goBack}
            onNext={nextFromTrekkingFeatures}
          />
        )}

        {step === "rutas" && (
          <StepRutas
            routes={routes}
            setRoutes={setRoutes}
            // A un lugar existente se le suma al menos una ruta; un lugar
            // nuevo puede cargarse sin rutas.
            required={trekkingMode === "new_route"}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {step === "sectores" && (
          <StepEscalada
            sectors={sectors}
            setSectors={setSectors}
            error={error}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {step === "sector_nuevo" && (
          <StepClimbingSectorForm
            sectors={sectors}
            setSectors={setSectors}
            error={error}
            onBack={goBack}
            onNext={nextFromNewSector}
          />
        )}

        {/* Vías de los sectores nuevos (opcional) */}
        {step === "vias" && (
          <StepClimbingRoutes
            sectors={sectors}
            routes={sectorRoutes}
            setRoutes={setSectorRoutes}
            error={error}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {/* Vías para un sector existente: al menos una */}
        {step === "vias_nuevas" && (
          <StepClimbingRoutes
            sectors={[{ name: climbingSectorName || "Sector", type: "", max_altitude: "", restrictions: "" }]}
            routes={climbingNewRoutes}
            setRoutes={setClimbingNewRoutes}
            required
            error={error}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {step === "servicio" && selectedCat?.name === "Surf" && (
          <StepSurf
            surf={surf}
            setSurf={setSurf}
            surfPhotoFiles={surfPhotoFiles}
            setSurfPhotoFiles={setSurfPhotoFiles}
            surfPhotoPreviews={surfPhotoPreviews}
            setSurfPhotoPreviews={setSurfPhotoPreviews}
            error={error}
            // Con una playa nueva, la escuela es opcional.
            optional={creatingNewSpot}
            onBack={goBack}
            onNext={goNext}
            onSkip={creatingNewSpot ? goNext : undefined}
          />
        )}

        {step === "servicio" && selectedCat?.name === "Kayak" && (
          <StepKayak
            kayaks={kayaks}
            setKayaks={setKayaks}
            kayakPhotoFiles={kayakPhotoFiles}
            setKayakPhotoFiles={setKayakPhotoFiles}
            kayakPhotoPreviews={kayakPhotoPreviews}
            setKayakPhotoPreviews={setKayakPhotoPreviews}
            error={error}
            optional={creatingNewSpot}
            onBack={goBack}
            onNext={goNext}
            onSkip={creatingNewSpot ? goNext : undefined}
          />
        )}

        {step === "imagenes" && (
          <StepImagenes
            images={images}
            setImages={setImages}
            previews={previews}
            setPreviews={setPreviews}
            setError={setError}
            error={error}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {step === "adicionales" && (
          <StepCategoriasAdicionales
            primaryCategoryName={selectedCat?.name ?? ""}
            additionalCategories={additionalCategories}
            setAdditionalCategories={setAdditionalCategories}
            motorhomeDetail={motorhomeDetail}
            setMotorhomeDetail={setMotorhomeDetail}
            campingDetail={campingDetail}
            setCampingDetail={setCampingDetail}
            glampingUnits={glampingUnits}
            setGlampingUnits={setGlampingUnits}
            selectedGlampingAmenities={selectedGlampingAmenities}
            setSelectedGlampingAmenities={setSelectedGlampingAmenities}
            selectedCampingAmenities={selectedCampingAmenities}
            setSelectedCampingAmenities={setSelectedCampingAmenities}
            error={error}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {submitting && <SubmittingOverlay uploadProgress={uploadProgress} />}

        {step === "resumen" && (
          <StepResumen
            selectedCat={selectedCat!}
            isService={isService ?? false}
            createsSpot={createsSpot(steps)}
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
            onBack={goBack}
            editTo={editTo}
            climbingMode={climbingMode}
            climbingSpotName={climbingSpotName}
            climbingSectorName={climbingSectorName}
            trekkingSpotName={trekkingSpotName}
            sectors={sectors}
            climbingNewRoutes={climbingNewRoutes}
            isPublic={isPublic}
            publicTransport={publicTransport}
            isResponsible={isService ? null : isResponsible}
            creatingNewSpot={creatingNewSpot}
            images={images}
            previews={previews}
            surfPhotoPreviews={surfPhotoPreviews}
            kayakPhotoPreviews={kayakPhotoPreviews}
            selectedAmenities={selectedAmenities}
            selectedGlampingAmenities={selectedGlampingAmenities}
            selectedCampingAmenities={selectedCampingAmenities}
            additionalCategories={additionalCategories}
            motorhomeDetail={motorhomeDetail}
            campingDetail={campingDetail}
            glampingUnits={glampingUnits}
            trekkingMode={trekkingMode}
            sectorRoutes={sectorRoutes}
            experiences={experiences}
          />
        )}
      </div>
    </div>
  )
}
