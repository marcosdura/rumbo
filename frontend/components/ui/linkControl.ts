// Conecta una etiqueta con su campo cuando el campo llega como children
// (lo usan Field, de "Agregar lugar", y las etiquetas del panel del dueño).
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react"

const CONTROLS = new Set(["input", "select", "textarea"])
export type ControlProps = { id?: string; children?: ReactNode; "aria-invalid"?: boolean; "aria-describedby"?: string }

// Le pone `id` (y el estado de error) al primer campo que encuentre, también
// adentro de un <div> (el teléfono con su país, el precio con "$ UYU").
// Devuelve los hijos y el id del campo (el que ya tenía, si tenía uno), o
// null si no encontró ninguno.
export function linkFirstControl(children: ReactNode, extra: ControlProps): [ReactNode, string | null] {
  let linked: string | null = null
  const visit = (node: ReactNode): ReactNode => Children.map(node, child => {
    if (linked || !isValidElement<ControlProps>(child) || typeof child.type !== "string") return child
    if (CONTROLS.has(child.type)) {
      linked = child.props.id ?? extra.id ?? null
      return cloneElement(child as ReactElement<ControlProps>, { id: linked ?? undefined, ...withoutId(extra) })
    }
    if (child.props.children === undefined) return child
    const inner = visit(child.props.children)
    return linked ? cloneElement(child as ReactElement<ControlProps>, undefined, inner) : child
  })
  const out = visit(children)
  return [out, linked]
}

const withoutId = (props: ControlProps) => {
  const rest = { ...props }
  delete rest.id
  return rest
}
