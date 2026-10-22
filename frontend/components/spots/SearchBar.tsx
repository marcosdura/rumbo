"use client"
import { Suspense, useState, useEffect, useRef, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import "./search-bar.css"

export const activities = ["Camping", "Glamping", "Escalada", "Kayak", "Trekking", "Surf", "Motorhome"]
const ACTIVITY_EMOJI: Record<string, string> = { Camping:"🏕️", Glamping:"🛖", Trekking:"🥾", Escalada:"🧗", Surf:"🏄", Kayak:"🛶", Motorhome:"🚐" }
const departments = [
  "Artigas","Canelones","Cerro Largo","Colonia","Durazno","Flores",
  "Florida","Lavalleja","Maldonado","Montevideo","Paysandú","Río Negro",
  "Rivera","Rocha","Salto","San José","Soriano","Tacuarembó","Treinta y Tres"
]

function normalize(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim()
}

// Un lugar sugerido mientras se escribe en "Dónde" (GET /spots/suggest).
type PlaceSuggestion = { id: number; name: string; slug: string; department: string | null; category: string | null }
// Lo que se puede elegir en "Dónde": un departamento, un lugar (lleva a su
// página) o buscar el texto escrito en los nombres.
type WhereOption =
  | { kind: "department"; value: string }
  | { kind: "place"; place: PlaceSuggestion }
  | { kind: "text"; value: string }

// Desde cuántas letras se piden lugares, y cuánto se espera a que termine de
// escribir (no un pedido por tecla).
const SUGGEST_MIN = 2
const SUGGEST_DELAY_MS = 200

// useSearchParams obliga a un <Suspense> para que las páginas se puedan
// armar estáticas (el buscador está en el navbar de todas). Mientras tanto
// se muestra la misma barra vacía: no salta nada.
const NO_PARAMS = new URLSearchParams()

type SearchBarProps = { onSearch?: () => void; hero?: boolean; compact?: boolean }
// Lo que se lee de la URL (useSearchParams o, mientras carga, nada).
type Params = { get(name: string): string | null; toString(): string }

export default function SearchBar(props: SearchBarProps) {
  return (
    <Suspense fallback={<SearchBarFields {...props} searchParams={NO_PARAMS} />}>
      <SearchBarFromUrl {...props} />
    </Suspense>
  )
}

function SearchBarFromUrl(props: SearchBarProps) {
  return <SearchBarFields {...props} searchParams={useSearchParams()} />
}

function SearchBarFields({ onSearch, hero = false, searchParams }: SearchBarProps & { searchParams: Params }) {
  // Arranca con lo que diga la URL (por ejemplo, en /search?activity=Surf).
  const [activity, setActivity] = useState(() => searchParams.get("activity") ?? "")
  const [activityInput, setActivityInput] = useState(activity)
  const [department, setDepartment] = useState(() => searchParams.get("department") ?? "")
  // Texto libre de "Dónde" (buscar por nombre): ?q= en la búsqueda.
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "")
  const [departmentInput, setDepartmentInput] = useState(department || query)
  const [openField, setOpenField] = useState<"activity" | "department" | null>(null)
  // highlighted index in dropdown (0 = best match / first item)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  // Si la URL cambia (otra búsqueda, atrás/adelante), los campos la siguen.
  // Se ajusta durante el render, no en un efecto, para no pintar un cuadro
  // con los valores viejos.
  const paramsKey = searchParams.toString()
  const [shownParams, setShownParams] = useState(paramsKey)
  if (paramsKey !== shownParams) {
    const a = searchParams.get("activity") ?? ""
    const d = searchParams.get("department") ?? ""
    const q = searchParams.get("q") ?? ""
    setShownParams(paramsKey)
    setActivity(a)
    setActivityInput(a)
    setDepartment(d)
    setQuery(q)
    setDepartmentInput(d || q)
    setOpenField(null)
  }

  // Cada vez que cambia lo que se escribe o el campo abierto, se resalta la
  // primera opción de la lista filtrada.
  const listKey = `${openField}|${activityInput}|${departmentInput}`
  const [shownList, setShownList] = useState(listKey)
  if (listKey !== shownList) {
    setShownList(listKey)
    setHighlightedIndex(0)
  }
  const router = useRouter()
  const barRef = useRef<HTMLDivElement>(null)
  const activityInputRef = useRef<HTMLInputElement>(null)
  const departmentInputRef = useRef<HTMLInputElement>(null)

  const filteredActivities = activities.filter((a) =>
    normalize(a).includes(normalize(activityInput))
  )
  const filteredDepartments = departments.filter((d) =>
    normalize(d).includes(normalize(departmentInput))
  )

  // Los lugares cuyo nombre coincide con lo escrito. Se guardan con el texto
  // que los pidió: si ya se escribió otra cosa, no se muestran (así no hace
  // falta vaciarlos a mano).
  const typed = normalize(departmentInput)
  const [places, setPlaces] = useState<{ for: string; items: PlaceSuggestion[] }>({ for: "", items: [] })
  const wantsPlaces = openField === "department" && typed.length >= SUGGEST_MIN
  useEffect(() => {
    if (!wantsPlaces) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      api.get<PlaceSuggestion[]>("/spots/suggest", { params: { q: typed }, signal: controller.signal })
        .then(({ data }) => setPlaces({ for: typed, items: Array.isArray(data) ? data : [] }))
        .catch(() => {})  // sin sugerencias se puede buscar igual por el texto
    }, SUGGEST_DELAY_MS)
    return () => { clearTimeout(timer); controller.abort() }
  }, [wantsPlaces, typed])
  const placeSuggestions = wantsPlaces && places.for === typed ? places.items : []
  const exactDepartment = departments.find(d => normalize(d) === typed)
  const whereOptions: WhereOption[] = [
    ...filteredDepartments.map(d => ({ kind: "department" as const, value: d })),
    ...placeSuggestions.map(place => ({ kind: "place" as const, place })),
    ...(typed.length >= SUGGEST_MIN && !exactDepartment ? [{ kind: "text" as const, value: departmentInput.trim() }] : []),
  ]

  const handleSearch = () => {
    // Lo escrito en "Dónde" sin elegir de la lista: un departamento si es
    // uno, si no se busca ese texto en los nombres.
    let dept = department
    let q = query
    if (openField === "department" && typed !== normalize(department || query)) {
      dept = exactDepartment ?? ""
      q = exactDepartment ? "" : departmentInput.trim()
    }
    setOpenField(null)
    onSearch?.()
    const params = new URLSearchParams({ activity, department: dept })
    if (q) params.set("q", q)
    router.push(`/search?${params.toString()}`)
  }

  const openActivity = () => {
    // Ya abierto (por ejemplo, la X le devuelve el cursor): no reponer lo
    // elegido, que pisaría lo que se acaba de borrar.
    if (openField === "activity") return
    // Keep existing value editable; don't wipe it
    setActivityInput(activity)
    setOpenField("activity")
    setTimeout(() => {
      activityInputRef.current?.focus()
      activityInputRef.current?.select()
    }, 0)
  }

  const openDepartment = () => {
    if (openField === "department") return
    setDepartmentInput(department || query)
    setOpenField("department")
    setTimeout(() => {
      departmentInputRef.current?.focus()
      departmentInputRef.current?.select()
    }, 0)
  }

  const selectActivity = (a: string) => {
    setActivity(a)
    setActivityInput(a)
    setOpenField(null)
  }

  // La X: borra lo elegido y lo escrito. Si el campo estaba abierto, sigue
  // abierto y con el cursor adentro para escribir otra cosa.
  const clearActivity = (e: ReactMouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActivity("")
    setActivityInput("")
    if (openField === "activity") activityInputRef.current?.focus()
  }

  const selectWhere = (option: WhereOption) => {
    if (option.kind === "place") {
      // Directo a su página: no hace falta pasar por la búsqueda.
      setOpenField(null)
      onSearch?.()
      router.push(`/spots/${option.place.slug}`)
      return
    }
    setDepartment(option.kind === "department" ? option.value : "")
    setQuery(option.kind === "text" ? option.value : "")
    setDepartmentInput(option.value)
    setOpenField(null)
  }

  const clearDepartment = (e: ReactMouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDepartment("")
    setQuery("")
    setDepartmentInput("")
    if (openField === "department") departmentInputRef.current?.focus()
  }

  // Keyboard handler shared by both inputs
  const handleKeyDown = (e: KeyboardEvent) => {
    const isActivity = openField === "activity"
    const isDepart  = openField === "department"
    if (!isActivity && !isDepart) return

    const count = isActivity ? filteredActivities.length : whereOptions.length

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) => Math.min(prev + 1, count - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (count === 0) return
      if (isActivity) selectActivity(filteredActivities[highlightedIndex])
      else selectWhere(whereOptions[highlightedIndex])
    } else if (e.key === "Escape") {
      setOpenField(null)
    }
  }

  useEffect(() => {
    if (!openField) return
    const handler = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpenField(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [openField])

  return (
    <>
      <div className={`search-bar${hero ? " hero" : ""}`} ref={barRef}>

        {/* ── Actividad ── */}
        <div
          className={`search-field ${openField === "activity" ? "is-open" : ""}`}
          onClick={openActivity}
        >
          <div className="search-field-label">Actividad</div>
          <div className="search-field-row">
            <input
              ref={activityInputRef}
              className="search-field-input"
              placeholder="¿Qué querés hacer?"
              value={openField === "activity" ? activityInput : activity}
              onChange={(e) => setActivityInput(e.target.value)}
              onFocus={openActivity}
              onKeyDown={handleKeyDown}
            />
            {/* Siempre que haya algo, también con el campo abierto (antes se
                ocultaba justo al volver a tocarlo). */}
            {(openField === "activity" ? activityInput : activity) && (
              <button type="button" className="clear-btn" aria-label="Borrar actividad" onMouseDown={clearActivity} onClick={e => e.stopPropagation()}>✕</button>
            )}
          </div>

          {openField === "activity" && (
            <div className="search-dropdown">
              <div className="search-dropdown-content">
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((a, i) => (
                    <div
                      key={a}
                      className={`search-dropdown-item
                        ${activity === a ? "selected" : ""}
                        ${i === highlightedIndex ? "highlighted" : ""}
                      `}
                      onMouseEnter={() => setHighlightedIndex(i)}
                      onMouseDown={(e) => { e.preventDefault(); selectActivity(a) }}
                    >
                      {activity === a && (
                        <span style={{ fontSize: 10, color: "var(--primary)" }}>●</span>
                      )}
                      {ACTIVITY_EMOJI[a] ? `${ACTIVITY_EMOJI[a]} ${a}` : a}
                    </div>
                  ))
                ) : (
                  <div className="search-dropdown-empty">
                    Intentá con otra actividad
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="search-divider" />

        {/* ── Dónde: un departamento o un lugar por su nombre ── */}
        <div
          className={`search-field ${openField === "department" ? "is-open" : ""}`}
          onClick={openDepartment}
        >
          <div className="search-field-label">Dónde</div>
          <div className="search-field-row">
            <input
              ref={departmentInputRef}
              className="search-field-input"
              placeholder="Departamento o lugar"
              aria-label="Dónde"
              value={openField === "department" ? departmentInput : (department || query)}
              onChange={(e) => setDepartmentInput(e.target.value)}
              onFocus={openDepartment}
              onKeyDown={handleKeyDown}
            />
            {(openField === "department" ? departmentInput : (department || query)) && (
              <button type="button" className="clear-btn" aria-label="Borrar dónde" onMouseDown={clearDepartment} onClick={e => e.stopPropagation()}>✕</button>
            )}
          </div>

          {openField === "department" && (
            <div className="search-dropdown">
              <div className="search-dropdown-content">
                {whereOptions.length > 0 ? (
                  whereOptions.map((option, i) => {
                    const first = option.kind !== "department" && (i === 0 || whereOptions[i - 1].kind === "department")
                    const className = `search-dropdown-item${i === highlightedIndex ? " highlighted" : ""}${option.kind === "department" && department === option.value ? " selected" : ""}`
                    return (
                      <div key={option.kind === "place" ? `p${option.place.id}` : `${option.kind}-${option.value}`}>
                        {first && option.kind === "place" && <div className="search-dropdown-heading">Lugares</div>}
                        <div
                          className={className}
                          onMouseEnter={() => setHighlightedIndex(i)}
                          onMouseDown={(e) => { e.preventDefault(); selectWhere(option) }}
                        >
                          {option.kind === "department" && (
                            <>
                              {department === option.value && <span style={{ fontSize: 10, color: "var(--primary)" }}>●</span>}
                              {option.value}
                            </>
                          )}
                          {option.kind === "place" && (
                            <span className="search-dropdown-place">
                              <span>{option.place.name}</span>
                              <span className="search-dropdown-sub">
                                {[option.place.category, option.place.department].filter(Boolean).join(" · ")}
                              </span>
                            </span>
                          )}
                          {option.kind === "text" && <span>🔎 Buscar «{option.value}»</span>}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="search-dropdown-empty">
                    Escribí un departamento o el nombre de un lugar
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="search-divider" />

        <button className="search-btn" onClick={handleSearch}>
          Buscar
        </button>

      </div>
    </>
  )
}