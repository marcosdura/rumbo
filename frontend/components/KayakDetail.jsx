export default function KayakDetail({ kayak }) {
  if (!kayak) return null

  const waterTypeLabel = {
    rio: { label: "Río", icon: "🏞️" },
    lago: { label: "Lago", icon: "🌊" },
    mar: { label: "Mar", icon: "🌊" },
  }

  const difficultyConfig = {
    facil: { label: "Fácil", color: "#16a34a", bg: "#dcfce7" },
    intermedio: { label: "Intermedio", color: "#d97706", bg: "#fef9c3" },
    dificil: { label: "Difícil", color: "#dc2626", bg: "#fee2e2" },
  }

  const kayakTypeLabel = {
    travesia: "Travesía",
    recreativo: "Recreativo",
    rapido: "Aguas Rápidas",
  }

  const diff = difficultyConfig[kayak.difficulty] || { label: kayak.difficulty, color: "#6b7280", bg: "#f3f4f6" }
  const water = waterTypeLabel[kayak.water_type] || { label: kayak.water_type, icon: "💧" }

  return (
    <div className="glass-card rounded-2xl p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-5">
        Detalles del Kayak
      </p>

      <div className="space-y-1">
        <div className="detail-row flex items-center justify-between">
          <span className="text-sm text-gray-500 flex items-center gap-2">
            {water.icon} Tipo de agua
          </span>
          <span className="text-sm font-medium text-gray-800">{water.label}</span>
        </div>

        <div className="detail-row flex items-center justify-between">
          <span className="text-sm text-gray-500 flex items-center gap-2">
            📊 Dificultad
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ color: diff.color, background: diff.bg }}
          >
            {diff.label}
          </span>
        </div>

        <div className="detail-row flex items-center justify-between">
          <span className="text-sm text-gray-500 flex items-center gap-2">
            ⏱️ Duración
          </span>
          <span className="text-sm font-medium text-gray-800">
            {kayak.duration} {kayak.duration === 1 ? "hora" : "horas"}
          </span>
        </div>

        <div className="detail-row flex items-center justify-between">
          <span className="text-sm text-gray-500 flex items-center gap-2">
            🛶 Tipo de kayak
          </span>
          <span className="text-sm font-medium text-gray-800">
            {kayakTypeLabel[kayak.kayak_type] || kayak.kayak_type}
          </span>
        </div>

        <div className="detail-row flex items-center justify-between">
          <span className="text-sm text-gray-500 flex items-center gap-2">
            🏪 Alquiler disponible
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={
              kayak.rental_available
                ? { color: "#16a34a", background: "#dcfce7" }
                : { color: "#6b7280", background: "#f3f4f6" }
            }
          >
            {kayak.rental_available ? "Sí" : "No"}
          </span>
        </div>
      </div>
    </div>
  )
}