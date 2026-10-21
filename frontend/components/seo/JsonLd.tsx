// Bloque <script type="application/ld+json"> — datos estructurados para
// Google (schema.org). Invisible para el usuario, no afecta el render.

// Lo que no puede quedar tal cual adentro de un <script>, y su forma escapada
// en JSON ("<" por "</script>"; U+2028 y U+2029 cortan la línea en JavaScript).
const BACKSLASH = String.fromCharCode(92)
const ESCAPES: [string, string][] = [
  ["<", `${BACKSLASH}u003c`],
  [String.fromCharCode(0x2028), `${BACKSLASH}u2028`],
  [String.fromCharCode(0x2029), `${BACKSLASH}u2029`],
]

// JSON seguro adentro de un <script>: los datos traen textos que escribe la
// gente (nombres, descripciones), y un "</script>" ahí cerraba el bloque y
// dejaba meter código en la página. Escapado así, el JSON es el mismo.
export function safeJson(data: unknown): string {
  return ESCAPES.reduce((json, [char, escaped]) => json.split(char).join(escaped), JSON.stringify(data))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function JsonLd({ data }: { data: Record<string, any> | Record<string, any>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(data) }}
    />
  )
}
