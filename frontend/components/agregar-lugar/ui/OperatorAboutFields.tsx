"use client"

// Descripción y precio de una escuela de surf o un servicio de kayak, en
// agregar lugar. Todo opcional: es lo que más pregunta quien busca clases o
// alquiler.
import type { CSSProperties } from "react"
import { s, sanitizeNum } from "../styles"
import Field from "./Field"
import type { OperatorAbout } from "../types"

export default function OperatorAboutFields({ value, onChange, what }: {
  value: OperatorAbout
  onChange: (field: keyof OperatorAbout, v: string) => void
  // "la escuela" / "el servicio"
  what: string
}) {
  return (
    <>
      <Field label={`Contá de qué se trata ${what}`} required={false}>
        <textarea
          style={{ ...s.input, height: 96, resize: "vertical" } as CSSProperties}
          maxLength={2000}
          placeholder="Qué ofrecen, para quién es, qué hace distinta la experiencia…"
          value={value.description}
          onChange={e => onChange("description", e.target.value)}
        />
      </Field>
      <div className="form-two-col">
        <Field label="Precio desde ($)" required={false} sublabel="Lo más barato que ofrecen. 0 si es gratis">
          <input style={s.input} type="number" min={0} value={value.price_from} onChange={e => onChange("price_from", sanitizeNum(e.target.value))} />
        </Field>
        <Field label="¿Por qué?" required={false} sublabel="Por ejemplo: por clase, por hora">
          <input style={s.input} type="text" maxLength={60} placeholder="por clase" value={value.price_note} onChange={e => onChange("price_note", e.target.value)} />
        </Field>
      </div>
    </>
  )
}
