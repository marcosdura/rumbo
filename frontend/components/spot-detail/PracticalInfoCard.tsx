// En la página del lugar: mascotas, reserva y señal (solo lo que se sabe).
// Va dentro del panel de detalles (components/spot-detail/SpotDetails.jsx),
// con las mismas filas que Detalles y Contacto: antes era una card adentro de
// otra card.
import { knownPractical, type PracticalInfo } from "@/lib/practicalInfo"

export default function PracticalInfoCard({ info }: { info: PracticalInfo }) {
  const items = knownPractical(info)
  if (items.length === 0) return null
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((item, i) => (
        <div key={item.key} className="detail-row" style={{ borderTop: i === 0 ? "1px solid #ede9e1" : "none", justifyContent: "flex-start" }}>
          <span aria-hidden="true">{item.emoji}</span>
          <span className={item.value ? "detail-value" : "detail-label"} style={{ textAlign: "left" }}>{item.text}</span>
        </div>
      ))}
    </div>
  )
}
