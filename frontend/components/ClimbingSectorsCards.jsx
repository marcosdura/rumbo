import Link from "next/link"

function ClimbingSectorsCards({ sectors }) {
  return (
    <div className="glass-card rounded-2xl p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-widest text-gray-700 mb-5">
        Sectores de Escalada
      </p>
      <div className="grid grid-cols-3 gap-4">
        {sectors.map(sector => (
          <Link
            key={sector.id}
            href={`/sectors/${sector.id}`}
            className="group bg-white rounded-2xl p-5 border border-[#e8e8e3] hover:shadow-md transition-shadow duration-200 block hover:-translate-y-1 transition-transform"
          >

            <div className="flex items-center justify-between mb-4">
              <h3 className="spot-title text-xl text-gray-900">{sector.name}</h3>
              <span className="w-7 h-7 rounded-full border border-black/10 bg-white/80 flex items-center justify-center text-[13px] text-[#555] transition-all duration-200 group-hover:bg-emerald-900 group-hover:border-emerald-900 group-hover:text-white group-hover:translate-x-0.5">
                →
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { val: `${sector.routes_count} rutas`, lbl: "Rutas" },
                { val: `${sector.min_grade} – ${sector.max_grade}`, lbl: "Graduación" },
                { val: `${sector.altitude} m`, lbl: "Altitud" },
              ].map(({ val, lbl }) => (
                <div key={lbl} className="bg-[#f5f4f0] rounded-xl p-3 text-center">
                  <p className="text-base font-semibold text-gray-900 leading-tight">{val}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{lbl}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-4">
              {[
                { icon: "🧭", val: sector.orientation, lbl: "Orientación" },
                { icon: "🪨", val: sector.rock_type, lbl: "Tipo de roca" },
              ].map(({ icon, val, lbl }) => (
                <div key={lbl} className="flex-1 bg-[#f5f4f0] rounded-xl px-3 py-2 flex items-center gap-2">
                  <span>{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{val}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{lbl}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium ${
                sector.bolted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}>
                🔩 {sector.bolted ? "Equipado" : "Trad / mixto"}
              </span>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium ${
                sector.shade === "full" ? "bg-blue-100 text-blue-800"
                  : sector.shade === "partial" ? "bg-sky-100 text-sky-800"
                  : "bg-orange-100 text-orange-800"
              }`}>
                ☀️ {sector.shade === "full" ? "Sombra total" : sector.shade === "partial" ? "Semisombra" : "Sol directo"}
              </span>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium ${
                sector.water_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                💧 {sector.water_available ? "Agua disponible" : "Sin agua"}
              </span>
            </div>

          </Link>
        ))}
      </div>
    </div>
  )
}

export default ClimbingSectorsCards