export default function SurfSchoolDetail({ surfSchool }) {
  if (!surfSchool) return null

  const classTypeConfig = {
    grupal: { label: "Grupal", icon: "👥" },
    privada: { label: "Privada", icon: "🧑" },
    intensivo: { label: "Intensivo", icon: "🔥" },
  }

  const classInfo = classTypeConfig[surfSchool.class_type] || {
    label: surfSchool.class_type,
    icon: "🏄",
  }

  return (
    <div className="glass-card rounded-2xl p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-5">
        Escuela de Surf
      </p>

      <div className="space-y-1">
        <div className="detail-row flex items-center justify-between">
          <span className="text-sm text-gray-500 flex items-center gap-2">
            🏄 Escuela
          </span>
          <span className="text-sm font-medium text-gray-800">{surfSchool.name}</span>
        </div>

        <div className="detail-row flex items-center justify-between">
          <span className="text-sm text-gray-500 flex items-center gap-2">
            {classInfo.icon} Tipo de clase
          </span>
          <span className="text-sm font-medium text-gray-800">{classInfo.label}</span>
        </div>

        <div className="detail-row flex items-center justify-between">
          <span className="text-sm text-gray-500 flex items-center gap-2">
            ⏱️ Duración
          </span>
          <span className="text-sm font-medium text-gray-800">
            {surfSchool.duration} {surfSchool.duration === 1 ? "hora" : "horas"}
          </span>
        </div>

        <div className="detail-row flex items-center justify-between">
          <span className="text-sm text-gray-500 flex items-center gap-2">
            🩳 Equipamiento incluido
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={
              surfSchool.equipment_include
                ? { color: "#16a34a", background: "#dcfce7" }
                : { color: "#6b7280", background: "#f3f4f6" }
            }
          >
            {surfSchool.equipment_include ? "Incluido" : "No incluido"}
          </span>
        </div>
      </div>
    </div>
  )
}