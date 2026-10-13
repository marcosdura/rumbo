import { useId } from "react"
import { linkFirstControl } from "@/components/ui/linkControl"

// La etiqueta de un campo. Antes era un texto suelto: el lector de pantalla
// leía "campo de texto" sin decir cuál, y tocar la etiqueta no llevaba al
// campo. Ahora la etiqueta apunta al campo; si adentro hay botones (Sí / No /
// No sé, opciones) en vez de un campo, los agrupa con ese nombre.
export default function Field({
  label, sublabel, required, hasError, errorText, children,
}: {
  label: string
  sublabel?: string
  required: boolean
  hasError?: boolean
  errorText?: string
  children: React.ReactNode
}) {
  const id = useId()
  const controlId = `${id}-campo`
  const labelId = `${id}-etiqueta`
  const errorId = `${id}-error`
  const showError = !!(hasError && errorText)
  const [content, linkedId] = linkFirstControl(children, {
    id: controlId,
    ...(hasError ? { "aria-invalid": true } : {}),
    ...(showError ? { "aria-describedby": errorId } : {}),
  })
  const linked = linkedId !== null
  const Label = linked ? "label" : "div"
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 4 }}
      {...(linked ? {} : { role: "group", "aria-labelledby": labelId })}
    >
      <Label
        id={labelId}
        {...(linked ? { htmlFor: linkedId } : {})}
        style={{ fontSize: 13, fontWeight: 500, color: hasError ? "#c53030" : "#1b1b19" }}
      >
        {label}{" "}
        {required
          ? <span style={{ fontSize: 12, color: "#c53030", fontWeight: 400 }}>(obligatorio)</span>
          : <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 400 }}>(opcional)</span>
        }
        {sublabel && (
          <span style={{ display: "block", fontSize: 11, fontWeight: 400, color: "var(--muted-strong)", marginTop: 2 }}>{sublabel}</span>
        )}
      </Label>
      {content}
      {showError && (
        <p id={errorId} style={{ fontSize: 12, color: "#c53030", margin: "2px 0 0" }}>{errorText}</p>
      )}
    </div>
  )
}
