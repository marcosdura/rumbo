"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const activities = ["Camping","Escalada", "Kayak", "Trekking"]
const departments = [
  "Artigas",
  "Canelones",
  "Cerro Largo",
  "Colonia",
  "Durazno",
  "Flores",
  "Florida",
  "Lavalleja",
  "Maldonado",
  "Montevideo",
  "Paysandú",
  "Río Negro",
  "Rivera",
  "Rocha",
  "Salto",
  "San José",
  "Soriano",
  "Tacuarembó",
  "Treinta y Tres"
]

export default function SearchBar() {
  const [activity, setActivity] = useState("")
  const [department, setDepartment] = useState("")
  const [openField, setOpenField] = useState(null)
  const router = useRouter()

  const handleSearch = () => {
    setOpenField(null)

    const params = new URLSearchParams({ activity, department })
    router.push(`/search?${params.toString()}`)
  }

  const toggleField = (field) => {
    setOpenField((prev) => (prev === field ? null : field))
  }

  // Cerrar al clickar afuera
  useEffect(() => {
    if (!openField) return
    const handler = (e) => {
      if (!e.target.closest(".search-bar")) setOpenField(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [openField])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

        .search-bar {
          font-family: 'DM Sans', sans-serif;
          display: inline-flex;
          align-items: center;
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 999px;
          padding: 5px 6px;
          gap: 4px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.07);
        }

        .search-divider {
          width: 1px;
          height: 24px;
          background: rgba(0,0,0,0.1);
          flex-shrink: 0;
        }

        .search-field {
          position: relative;
          padding: 5px 16px;
          border-radius: 999px;
          cursor: pointer;
          min-width: 170px;
          transition: background 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          user-select: none;
        }
        .search-field:hover,
        .search-field.is-open {
          background: rgba(234, 234, 234, 0.75);
        }

        .search-field-label {
          font-size: 14px;
          font-weight: 500;
          color: #464948;
          margin-bottom: 1px;
          letter-spacing: 0.02em;
          line-height: 1.3;
        }

        .search-field-value {
          font-size: 12px;
          font-weight: 400;
          color: #1a1a1a;
          line-height: 1.4;
        }
        .search-field-value.placeholder {
          color: #9ca3a0;
        }

        .search-dropdown {
          position: absolute;
          left: 0;
          top: calc(100% + 8px);
          min-width: 170px;
          max-height: 260px; 
          overflow-y: auto;  
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          z-index: 9999;
          overflow: visible;
          transform-origin: top center;
          animation: dropdownIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }

        .search-dropdown-item {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #1a1a1a;
          padding: 10px 16px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .search-dropdown-item:hover {
          background: linear-gradient(135deg, #e8e3d8, #C6BDAA);
          color: #4a443b;
        }

        .search-btn {
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: 2px;

          background: linear-gradient(135deg, #e8e3d8, #c6bdaa);
          border: 1px solid #b4aa96;
          color: #4a443b;

          font-size: 13px;
          font-weight: 500;
          padding: 7px 18px;
          border-radius: 999px;
          cursor: pointer;

          transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .search-btn:hover {
          background: linear-gradient(135deg, #d6cebf, #b4aa96);
          box-shadow: 0 4px 14px rgba(198, 189, 170, 0.4);
          transform: translateY(-1px);
        }
        .search-btn:active {
          transform: translateY(0px);
        }
        
        .search-dropdown-content {
          max-height: 260px;
          overflow-y: auto;
        }
      `}</style>

      <div className="search-bar">

        {/* Actividad */}
        <div
          className={`search-field ${openField === "activity" ? "is-open" : ""}`}
          onClick={() => toggleField("activity")}
        >
          <div className="search-field-label">Actividad</div>
          <div className={`search-field-value ${!activity ? "placeholder" : ""}`}>
            {activity || "Seleccionar"}
          </div>
          {openField === "activity" && (
            <div className="search-dropdown">
              <div className="search-dropdown-content">
              {activities.map((a) => (
                <div
                  key={a}
                  className="search-dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActivity(a)
                    setOpenField(null)
                  }}
                >
                  {a}
                </div>
              ))}
              </div>
            </div>
          )}
        </div>

        <div className="search-divider" />

        {/* Departamento */}
        <div
          className={`search-field ${openField === "department" ? "is-open" : ""}`}
          onClick={() => toggleField("department")}
        >
          <div className="search-field-label">Departamento</div>
          <div className={`search-field-value ${!department ? "placeholder" : ""}`}>
            {department || "Seleccionar"}
          </div>
          {openField === "department" && (
            <div className="search-dropdown">
              <div className="search-dropdown-content">
              {departments.map((d) => (
                <div
                  key={d}
                  className="search-dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDepartment(d)
                    setOpenField(null)
                  }}
                >
                  {d}
                </div>
              ))}
              </div>
            </div>
          )}
        </div>

        <div className="search-divider" />

        <button className="search-btn" onClick={handleSearch}>
          🔍
        </button>

      </div>
    </>
  )
}