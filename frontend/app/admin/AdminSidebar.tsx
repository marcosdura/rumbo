"use client"

// La navegación del panel de admin: una barra a la izquierda, debajo del
// Navbar, con todas las secciones y cuánto hay en cada una. Antes eran filas
// de pestañas arriba del contenido. En el celular es una fila que se desliza.
import type { AdminMode } from "./types"

export type SidebarGroup = { title: string; tabs: { id: AdminMode; label: string }[] }

export default function AdminSidebar({ groups, mode, counts, onGo }: {
  groups: SidebarGroup[]
  mode: AdminMode
  counts: Partial<Record<AdminMode, number | undefined>>
  onGo: (mode: AdminMode) => void
}) {
  const item = (id: AdminMode, label: string) => {
    const n = counts[id]
    const active = mode === id
    return (
      <li key={id}>
        <button type="button" onClick={() => onGo(id)} className={`admin-side-item${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>
          <span className="admin-side-label">{label}</span>
          {/* El espacio, para que se lea "Reportes 4" y no "Reportes4". */}
          {n ? <>{" "}<span className="admin-side-count">{n}</span></> : null}
        </button>
      </li>
    )
  }

  return (
    <nav aria-label="Secciones del panel" className="admin-sidebar">
      <style>{`
        .admin-sidebar {
          width: 236px; flex-shrink: 0; align-self: flex-start;
          position: sticky; top: 16px;
          background: #fff; border: 1px solid var(--border); border-radius: 16px;
          padding: 10px; box-sizing: border-box;
        }
        .admin-side-group { margin: 0; padding: 0; list-style: none; }
        .admin-side-title {
          font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--muted); margin: 14px 10px 6px;
        }
        .admin-side-item {
          width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px;
          padding: 9px 10px; border: none; border-radius: 10px; background: none; cursor: pointer;
          font-family: inherit; font-size: 13px; font-weight: 600; color: #3d3d3a; text-align: left;
          transition: background 0.15s;
        }
        .admin-side-item:hover { background: #f5f4f0; }
        .admin-side-item.is-active { background: var(--primary); color: #fff; }
        .admin-side-count {
          min-width: 22px; padding: 1px 7px; border-radius: 999px; box-sizing: border-box;
          font-size: 11px; font-weight: 700; text-align: center;
          background: #fde68a; color: #6b4e06;
        }
        .admin-side-item.is-active .admin-side-count { background: #fff; color: var(--primary-dark); }

        @media (max-width: 860px) {
          .admin-sidebar {
            width: 100%; position: static; padding: 6px;
            display: flex; gap: 4px; overflow-x: auto;
          }
          .admin-side-group { display: flex; gap: 4px; flex-shrink: 0; }
          .admin-side-title { display: none; }
          .admin-side-item { white-space: nowrap; }
        }
      `}</style>
      <ul className="admin-side-group">{item("resumen", "📊 Resumen")}</ul>
      {groups.map(g => (
        <div key={g.title} style={{ display: "contents" }}>
          <p className="admin-side-title">{g.title}</p>
          <ul className="admin-side-group" aria-label={g.title}>
            {g.tabs.map(t => item(t.id, t.label))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
