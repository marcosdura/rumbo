"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const activities = ["Camping", "Glamping", "Escalada", "Kayak", "Trekking", "Surf", "Motorhome"]
const ACTIVITY_EMOJI = { Camping:"🏕️", Glamping:"🛖", Trekking:"🥾", Escalada:"🧗", Surf:"🏄", Kayak:"🛶", Motorhome:"🚐" }
const departments = [
  "Artigas","Canelones","Cerro Largo","Colonia","Durazno","Flores",
  "Florida","Lavalleja","Maldonado","Montevideo","Paysandú","Río Negro",
  "Rivera","Rocha","Salto","San José","Soriano","Tacuarembó","Treinta y Tres"
]

function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export default function SearchBar({ onSearch, hero = false } = {}) {
  const [activity, setActivity] = useState("")
  const [activityInput, setActivityInput] = useState("")
  const [department, setDepartment] = useState("")
  const [departmentInput, setDepartmentInput] = useState("")
  const [openField, setOpenField] = useState(null)
  // highlighted index in dropdown (0 = best match / first item)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const router = useRouter()
  const barRef = useRef(null)
  const activityInputRef = useRef(null)
  const departmentInputRef = useRef(null)
  const searchParams = useSearchParams()

  const filteredActivities = activities.filter((a) =>
    normalize(a).includes(normalize(activityInput))
  )
  const filteredDepartments = departments.filter((d) =>
    normalize(d).includes(normalize(departmentInput))
  )

  // Reset highlighted index whenever the filtered list changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [activityInput, departmentInput, openField])

  const handleSearch = () => {
    setOpenField(null)
    onSearch?.()
    const params = new URLSearchParams({ activity, department })
    router.push(`/search?${params.toString()}`)
  }

  const openActivity = () => {
    // Keep existing value editable; don't wipe it
    setActivityInput(activity)
    setOpenField("activity")
    setTimeout(() => {
      activityInputRef.current?.focus()
      activityInputRef.current?.select()
    }, 0)
  }

  const openDepartment = () => {
    setDepartmentInput(department)
    setOpenField("department")
    setTimeout(() => {
      departmentInputRef.current?.focus()
      departmentInputRef.current?.select()
    }, 0)
  }

  const selectActivity = (a) => {
    setActivity(a)
    setActivityInput(a)
    setOpenField(null)
  }

  const clearActivity = (e) => {
    e.stopPropagation()
    setActivity("")
    setActivityInput("")
  }

  const selectDepartment = (d) => {
    setDepartment(d)
    setDepartmentInput(d)
    setOpenField(null)
  }

  const clearDepartment = (e) => {
    e.stopPropagation()
    setDepartment("")
    setDepartmentInput("")
  }

  // Keyboard handler shared by both inputs
  const handleKeyDown = (e) => {
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
    const handler = (e) => {
      if (!barRef.current?.contains(e.target)) setOpenField(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [openField])

  useEffect(() => {
    const a = searchParams.get("activity") ?? ""
    const d = searchParams.get("department") ?? ""
    setActivity(a)
    setActivityInput(a)
    setDepartment(d)
    setDepartmentInput(d)
    setOpenField(null)
  }, [searchParams])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .search-bar {
          font-family: 'DM Sans', sans-serif;
          display: inline-flex;
          align-items: center;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 5px 6px;
          gap: 4px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
        }

        .search-divider {
          width: 1px;
          height: 24px;
          background: var(--border);
          flex-shrink: 0;
        }

        .search-field {
          position: relative;
          padding: 6px 18px;
          border-radius: 999px;
          cursor: pointer;
          min-width: 170px;
          transition: background 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          user-select: none;
        }
        .search-field:hover { background: #f7f5f0; }
        .search-field.is-open { background: #f0f7f3; }

        .search-field-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--primary);
          margin-bottom: 2px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          line-height: 1.3;
        }

        .search-field-row {
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
        }

        .search-field-input {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #1b1b19;
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          min-width: 0;
          line-height: 1.4;
          cursor: pointer;
          padding-right: 26px;
        }
        .search-field-input::placeholder {
          color: #b0aca5;
          font-weight: 400;
        }

        .search-dropdown {
          position: absolute;
          left: 0;
          top: calc(100% + 10px);
          min-width: 200px;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.09);
          z-index: 9999;
          transform-origin: top center;
          animation: dropdownIn 0.18s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          overflow: hidden;
        }

        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .search-dropdown-content {
          max-height: 260px;
          overflow-y: auto;
        }

        .search-dropdown-item {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #3d3d3a;
          padding: 10px 16px;
          cursor: pointer;
          transition: background 0.13s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .search-dropdown-item:hover {
          background: #f0f7f3;
          color: var(--primary-dark);
        }
        /* keyboard highlight (best match / arrow navigation) */
        .search-dropdown-item.highlighted {
          background: #dff0e8;
          color: var(--primary-dark);
        }
        .search-dropdown-item.selected {
          background: #e8f5ee;
          color: var(--primary-dark);
          font-weight: 600;
        }

        .search-dropdown-empty {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #b0aca5;
          padding: 14px 16px;
          text-align: center;
          font-style: italic;
        }

        .search-btn {
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-left: 2px;
          background: var(--primary-dark);
          border: none;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 999px;
          cursor: pointer;
          letter-spacing: 0.03em;
          transition: all 0.22s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .search-btn:hover {
          background: var(--primary);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(27, 67, 50, 0.28);
        }
        .search-btn:active { transform: translateY(0); }

        .clear-btn {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #d0cdc7;
          color: #fff;
          font-size: 13px;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s;
          line-height: 1;
        }
        .clear-btn:hover { background: var(--muted); }

        /* Hero variant */
        .search-bar.hero {
          width: 100%;
          max-width: 700px;
          padding: 6px 8px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          border-color: rgba(255,255,255,0.25);
          text-align: left;
        }
        .search-bar.hero .search-field {
          min-width: 200px;
          padding: 10px 22px;
          flex: 1;
        }
        .search-bar.hero .search-field-input {
          font-size: 15px;
        }
        .search-bar.hero .search-btn {
          font-size: 14px;
          padding: 14px 28px;
        }
        @media (max-width: 640px) {
          .search-bar.hero {
            flex-direction: column;
            border-radius: 18px;
            padding: 8px;
            align-items: stretch;
            width: 100%;
            max-width: 100%;
          }
          .search-bar.hero .search-field {
            min-width: 0;
            width: 100%;
            border-radius: 12px;
          }
          .search-bar.hero .search-divider { display: none; }
          .search-bar.hero .search-btn {
            border-radius: 12px;
            width: 100%;
          }
        }

      `}</style>

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
            {activity && openField !== "activity" && (
              <span className="clear-btn" onClick={clearActivity}>✕</span>
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
            {department && openField !== "department" && (
              <span className="clear-btn" onClick={clearDepartment}>✕</span>
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