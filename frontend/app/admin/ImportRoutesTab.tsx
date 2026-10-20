"use client"

// Importar vías de escalada desde un Excel o un CSV (solo el admin). Se
// elige el lugar y el sector, se sube la planilla y, antes de guardar, se ve
// qué vías son nuevas, cuáles actualizan una que ya está (mismo nombre) y qué
// filas tienen errores (lib/routeImport.ts, backend/route_import.py).
import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { api, ApiError } from "@/lib/api"
import { card, input } from "@/lib/theme"
import { parseCsv, routeKey, rowsFromMatrix, type ParsedRow } from "@/lib/routeImport"
import type { AdminSpot } from "./types"

type Sector = { id: number; name: string; routes: { name: string }[] }

const button = (primary: boolean, disabled = false) => ({
  padding: "9px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
  cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
  border: primary ? "1px solid var(--primary)" : "1px solid var(--border)",
  background: primary ? "var(--primary)" : "#fff", color: primary ? "#fff" : "#3d3d3a",
}) as const

const STATUS = {
  nueva: { label: "Nueva", bg: "#e3f2e9", color: "#1f5135" },
  actualiza: { label: "Actualiza", bg: "#fff4d6", color: "#6b4e06" },
  error: { label: "Error", bg: "#fde8e8", color: "#9b1c1c" },
}

async function readFile(file: File): Promise<unknown[][]> {
  if (/\.csv$/i.test(file.name)) return parseCsv(await file.text())
  // La librería de Excel se baja recién al subir un .xlsx.
  const { readSheet } = await import("read-excel-file/browser")
  return (await readSheet(file)) as unknown[][]
}

export default function ImportRoutesTab({ spots, token, loading }: {
  spots: AdminSpot[]
  token: string | undefined
  loading: boolean
}) {
  const climbing = useMemo(
    () => spots.filter(s => s.category?.name === "Escalada" && !s.owner_deleted_at).sort((a, b) => a.name.localeCompare(b.name)),
    [spots],
  )
  const [spotId, setSpotId] = useState<number | null>(null)
  const [sectors, setSectors] = useState<Sector[] | null>(null)
  const [sectorId, setSectorId] = useState<number | null>(null)
  const [rows, setRows] = useState<ParsedRow[] | null>(null)
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  // Los sectores del lugar (también los que están en revisión), con sus vías.
  useEffect(() => {
    if (!spotId || !token) return
    api.get<{ sectors: Sector[] }>(`/spots/${spotId}/owner-content`, { token })
      .then(({ data }) => setSectors(data.sectors))
      .catch(() => setError("No se pudieron cargar los sectores de ese lugar."))
  }, [spotId, token])

  const sector = sectors?.find(s => s.id === sectorId) ?? null
  const existing = useMemo(() => new Set((sector?.routes ?? []).map(r => routeKey(r.name))), [sector])
  const statusOf = (r: ParsedRow) => (r.errors.length ? "error" : existing.has(routeKey(r.row.name)) ? "actualiza" : "nueva")
  const counts = (rows ?? []).reduce((n, r) => ({ ...n, [statusOf(r)]: n[statusOf(r)] + 1 }), { nueva: 0, actualiza: 0, error: 0 })
  const canImport = !!sector && !!rows && rows.length > 0 && counts.error === 0 && !saving

  function chooseSpot(e: ChangeEvent<HTMLSelectElement>) {
    setSpotId(Number(e.target.value) || null)
    setSectors(null); setSectorId(null); setResult(null); setError(null)
  }

  async function chooseFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setResult(null); setError(null); setRows(null); setFileName(file.name)
    try {
      const parsed = rowsFromMatrix(await readFile(file))
      if (parsed.error) setError(parsed.error)
      else setRows(parsed.rows)
    } catch {
      setError("No se pudo leer el archivo. Tiene que ser un Excel (.xlsx) o un CSV.")
    }
  }

  async function importRows() {
    if (!canImport || !sector) return
    setSaving(true); setError(null)
    try {
      const { data } = await api.post<{ created: number; updated: number }>(
        `/sectors/${sector.id}/routes/import`, { routes: rows!.map(r => r.row) }, { token },
      )
      setResult(`Listo: ${data.created} vía${data.created === 1 ? "" : "s"} nueva${data.created === 1 ? "" : "s"} y ${data.updated} actualizada${data.updated === 1 ? "" : "s"} en ${sector.name}.`)
      setRows(null); setFileName("")
      // Las vías del sector, ya con las nuevas (para la próxima planilla).
      const { data: content } = await api.get<{ sectors: Sector[] }>(`/spots/${spotId}/owner-content`, { token })
      setSectors(content.sectors)
    } catch (e) {
      setError(e instanceof ApiError && e.status !== 422 ? e.message : "No se pudo importar. Revisá la planilla e intentá de nuevo.")
    }
    setSaving(false)
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</p>

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ ...card, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ fontSize: 13, color: "var(--muted-strong)", margin: 0, lineHeight: 1.6 }}>
          Subí un Excel (.xlsx, como lo baja Google Sheets con Archivo → Descargar) o un CSV con las columnas <strong>Nombre</strong> (obligatoria), Grado, Tipo, Largo (m), Chapas y Descripción.
          Si una vía ya está en el sector (mismo nombre), se actualiza con lo que trae la planilla; una celda vacía no borra lo que ya tenía.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={{ flex: "1 1 240px", fontSize: 12, fontWeight: 600, color: "#3d3d3a" }}>
            Lugar
            <select aria-label="Lugar" value={spotId ?? ""} onChange={chooseSpot} style={{ ...input, marginTop: 4 }}>
              <option value="">— Elegí un lugar de escalada —</option>
              {climbing.map(s => <option key={s.id} value={s.id}>{s.name}{s.department ? ` (${s.department})` : ""}</option>)}
            </select>
          </label>
          <label style={{ flex: "1 1 240px", fontSize: 12, fontWeight: 600, color: "#3d3d3a" }}>
            Sector
            <select aria-label="Sector" value={sectorId ?? ""} disabled={!sectors} onChange={e => { setSectorId(Number(e.target.value) || null); setResult(null) }} style={{ ...input, marginTop: 4 }}>
              <option value="">{sectors && sectors.length === 0 ? "Este lugar no tiene sectores" : "— Elegí un sector —"}</option>
              {(sectors ?? []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.routes.length} vías)</option>)}
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label style={button(true, !sector)}>
            📄 Subir planilla
            <input type="file" accept=".xlsx,.csv" onChange={chooseFile} disabled={!sector} style={{ display: "none" }} aria-label="Subir planilla" />
          </label>
          <a href="/vias-ejemplo.xlsx" download style={{ ...button(false), textDecoration: "none" }}>Descargar planilla de ejemplo</a>
          {fileName && <span style={{ fontSize: 12, color: "var(--muted)" }}>{fileName}</span>}
        </div>
        {error && <p role="alert" style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>}
        {result && <p role="status" style={{ color: "#1f5135", background: "#e3f2e9", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 600, margin: 0 }}>{result}</p>}
      </div>

      {rows && (
        <div style={{ ...card, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
              {rows.length} vías: {counts.nueva} nuevas, {counts.actualiza} se actualizan{counts.error ? `, ${counts.error} con errores` : ""}
            </p>
            <button type="button" onClick={importRows} disabled={!canImport} style={button(true, !canImport)}>
              {saving ? "Importando..." : counts.error ? "Corregí los errores para importar" : `Importar ${rows.length} vías`}
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {["Fila", "Nombre", "Grado", "Tipo", "Largo", "Chapas", "Estado"].map(h => <th key={h} style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const st = STATUS[statusOf(r)]
                  return (
                    <tr key={r.line} style={{ borderBottom: "1px solid #f0ede6", verticalAlign: "top" }}>
                      <td style={{ padding: "8px", color: "var(--muted)" }}>{r.line}</td>
                      <td style={{ padding: "8px", fontWeight: 600 }}>{r.row.name || "—"}</td>
                      <td style={{ padding: "8px" }}>{r.row.grade ?? "—"}</td>
                      <td style={{ padding: "8px" }}>{r.row.type ?? "—"}</td>
                      <td style={{ padding: "8px" }}>{r.row.length ?? "—"}</td>
                      <td style={{ padding: "8px" }}>{r.row.bolts ?? "—"}</td>
                      <td style={{ padding: "8px" }}>
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                        {r.repeated && <span style={{ display: "block", fontSize: 11, color: "var(--muted-strong)", marginTop: 2 }}>Repetida en la planilla: queda la última</span>}
                        {r.errors.map(e => <span key={e} style={{ display: "block", fontSize: 11, color: "#9b1c1c", marginTop: 2 }}>{e}</span>)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
