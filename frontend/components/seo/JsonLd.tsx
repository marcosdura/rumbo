// Bloque <script type="application/ld+json"> — datos estructurados para
// Google (schema.org). Invisible para el usuario, no afecta el render.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
