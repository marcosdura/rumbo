"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const activities = ["Camping","Escalada", "Kayak", "Trekking", "Surf"]
const departments = [
  "Artigas","Canelones","Cerro Largo","Colonia","Durazno","Flores",
  "Florida","Lavalleja","Maldonado","Montevideo","Paysandú","Río Negro",
  "Rivera","Rocha","Salto","San José","Soriano","Tacuarembó","Treinta y Tres"
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .search-bar {
          font-family: 'DM Sans', sans-serif;
          display: inline-flex;
          align-items: center;
          background: #fff;
          border: 1px solid #e0ddd6;
          border-radius: 999px;
          padding: 5px 6px;
          gap: 4px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
        }

        .search-divider {
          width: 1px;
          height: 24px;
          background: #e0ddd6;
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
        .search-field:hover {
          background: #f7f5f0;
        }
        .search-field.is-open {
          background: #f0f7f3;
        }

        .search-field-label {
          font-size: 11px;
          font-weight: 600;
          color: #2d6a4f;
          margin-bottom: 2px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          line-height: 1.3;
        }

        .search-field-value {
          font-size: 13px;
          font-weight: 500;
          color: #1b1b19;
          line-height: 1.4;
        }
        .search-field-value.placeholder {
          color: #b0aca5;
          font-weight: 400;
        }

        .search-dropdown {
          position: absolute;
          left: 0;
          top: calc(100% + 10px);
          min-width: 190px;
          background: #fff;
          border: 1px solid #e0ddd6;
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
          color: #1b4332;
        }
        .search-dropdown-item.selected {
          background: #e8f5ee;
          color: #1b4332;
          font-weight: 600;
        }

        .search-btn {
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-left: 2px;
          background: #1b4332;
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
          background: #2d6a4f;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(27, 67, 50, 0.28);
        }
        .search-btn:active {
          transform: translateY(0);
        }

        .clear-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #d0cdc7;
          color: #fff;
          font-size: 9px;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s;
          line-height: 1;
        }
        .clear-btn:hover {
          background: #9a9690;
        }
      `}</style>

      <div className="search-bar">

        {/* Actividad */}
        <div
          className={`search-field ${openField === "activity" ? "is-open" : ""}`}
          onClick={() => toggleField("activity")}
        >
          <div className="search-field-label">Actividad</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div className={`search-field-value ${!activity ? "placeholder" : ""}`}>
              {activity || "¿Qué querés hacer?"}
            </div>
            {activity && (
              <span
                className="clear-btn"
                onClick={(e) => { e.stopPropagation(); setActivity("") }}
              >✕</span>
            )}
          </div>

          {openField === "activity" && (
            <div className="search-dropdown">
              <div className="search-dropdown-content">
                {activities.map((a) => (
                  <div
                    key={a}
                    className={`search-dropdown-item ${activity === a ? "selected" : ""}`}
                    onClick={(e) => { e.stopPropagation(); setActivity(a); setOpenField(null) }}
                  >
                    {activity === a && (
                      <span style={{ fontSize: 10, color: "#2d6a4f" }}>●</span>
                    )}
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
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div className={`search-field-value ${!department ? "placeholder" : ""}`}>
              {department || "¿A dónde vas?"}
            </div>
            {department && (
              <span
                className="clear-btn"
                onClick={(e) => { e.stopPropagation(); setDepartment("") }}
              >✕</span>
            )}
          </div>

          {openField === "department" && (
            <div className="search-dropdown">
              <div className="search-dropdown-content">
                {departments.map((d) => (
                  <div
                    key={d}
                    className={`search-dropdown-item ${department === d ? "selected" : ""}`}
                    onClick={(e) => { e.stopPropagation(); setDepartment(d); setOpenField(null) }}
                  >
                    {department === d && (
                      <span style={{ fontSize: 10, color: "#2d6a4f" }}>●</span>
                    )}
                    {d}
                  </div>
                ))}
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