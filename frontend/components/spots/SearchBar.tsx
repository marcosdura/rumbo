"use client"
import { Suspense, useState, useEffect, useRef, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import "./search-bar.css"

export const activities = ["Camping", "Glamping", "Escalada", "Kayak", "Trekking", "Surf", "Motorhome"]
const ACTIVITY_EMOJI: Record<string, string> = { Camping:"🏕️", Glamping:"🛖", Trekking:"🥾", Escalada:"🧗", Surf:"🏄", Kayak:"🛶", Motorhome:"🚐" }
const departments = [
  "Artigas","Canelones","Cerro Largo","Colonia","Durazno","Flores",
  "Florida","Lavalleja","Maldonado","Montevideo","Paysandú","Río Negro",
  "Rivera","Rocha","Salto","San José","Soriano","Tacuarembó","Treinta y Tres"
]

function normalize(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

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
  const [departmentInput, setDepartmentInput] = useState(department)
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
    setShownParams(paramsKey)
    setActivity(a)
    setActivityInput(a)
    setDepartment(d)
    setDepartmentInput(d)
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

  const handleSearch = () => {
    setOpenField(null)
    onSearch?.()
    const params = new URLSearchParams({ activity, department })
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
    setDepartmentInput(department)
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

  const selectDepartment = (d: string) => {
    setDepartment(d)
    setDepartmentInput(d)
    setOpenField(null)
  }

  const clearDepartment = (e: ReactMouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDepartment("")
    setDepartmentInput("")
    if (openField === "department") departmentInputRef.current?.focus()
  }

  // Keyboard handler shared by both inputs
  const handleKeyDown = (e: KeyboardEvent) => {
    const isActivity = openField === "activity"
    const isDepart  = openField === "department"
    if (!isActivity && !isDepart) return

    const list = isActivity ? filteredActivities : filteredDepartments
    const select = isActivity ? selectActivity : selectDepartment

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) => Math.min(prev + 1, list.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (list.length > 0) {
        select(list[highlightedIndex])
      }
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

        {/* ── Departamento ── */}
        <div
          className={`search-field ${openField === "department" ? "is-open" : ""}`}
          onClick={openDepartment}
        >
          <div className="search-field-label">Departamento</div>
          <div className="search-field-row">
            <input
              ref={departmentInputRef}
              className="search-field-input"
              placeholder="¿A dónde vas?"
              value={openField === "department" ? departmentInput : department}
              onChange={(e) => setDepartmentInput(e.target.value)}
              onFocus={openDepartment}
              onKeyDown={handleKeyDown}
            />
            {(openField === "department" ? departmentInput : department) && (
              <button type="button" className="clear-btn" aria-label="Borrar departamento" onMouseDown={clearDepartment} onClick={e => e.stopPropagation()}>✕</button>
            )}
          </div>

          {openField === "department" && (
            <div className="search-dropdown">
              <div className="search-dropdown-content">
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((d, i) => (
                    <div
                      key={d}
                      className={`search-dropdown-item
                        ${department === d ? "selected" : ""}
                        ${i === highlightedIndex ? "highlighted" : ""}
                      `}
                      onMouseEnter={() => setHighlightedIndex(i)}
                      onMouseDown={(e) => { e.preventDefault(); selectDepartment(d) }}
                    >
                      {department === d && (
                        <span style={{ fontSize: 10, color: "var(--primary)" }}>●</span>
                      )}
                      {d}
                    </div>
                  ))
                ) : (
                  <div className="search-dropdown-empty">
                    Intentá con otro lugar
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