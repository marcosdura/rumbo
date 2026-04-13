// components/TrekkingRoutes.jsx

function TrekkingRoutes({ routes }) {
  return (
    <div className="glass-card rounded-2xl p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-widest text-gray-700 mb-5">
        Rutas de Trekking
      </p>
      <div className="grid grid-cols-2 gap-4">
        {routes.map(route => (
          <div key={route.id} className="bg-white rounded-2xl p-5 border border-[#e8e8e3]">

            <h3 className="spot-title text-xl text-gray-900 mb-4">{route.name}</h3>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { val: `${route.distance_km} km`, lbl: "Distancia" },
                { val: `${route.duration_hours} h`, lbl: "Duración" },
                { val: `↑ ${route.elevation_gain} m`, lbl: "Desnivel +" },
                { val: `↓ ${route.elevation_loss} m`, lbl: "Desnivel −" },
              ].map(({ val, lbl }) => (
                <div key={lbl} className="bg-[#f5f4f0] rounded-xl p-3 text-center">
                  <p className="text-base font-semibold text-gray-900 leading-tight">{val}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{lbl}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-4">
              {[
                { icon: "⛰️", val: `${route.max_altitude} m`, lbl: "Altitud máx." },
                { icon: "🏕️", val: `${route.min_altitude} m`, lbl: "Altitud mín." },
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

            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                route.difficulty === "fácil"
                  ? "bg-green-100 text-green-800 border-green-300"
                  : route.difficulty === "difícil"
                  ? "bg-red-100 text-red-800 border-red-300"
                  : "bg-yellow-100 text-yellow-800 border-yellow-300"
              }`}>
                {route.difficulty === "fácil" ? "🟢" : route.difficulty === "difícil" ? "🔴" : "🟡"} {route.difficulty}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                {route.route_type === "circular" ? "🔁" : "↩️"} {route.route_type}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                🧗 Técnico: {route.technical_level}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                💪 Físico: {route.physical_demand}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium ${
                route.water_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                💧 {route.water_available ? "Agua disponible" : "Sin agua"}
              </span>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium ${
                route.camping_allowed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                ⛺ {route.camping_allowed ? "Camping permitido" : "Sin camping"}
              </span>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium ${
                route.signal === "none"
                  ? "bg-red-100 text-red-800"
                  : route.signal === "low"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}>
                📶 {route.signal === "none" ? "Sin señal" : route.signal === "low" ? "Señal baja" : "Señal media"}
              </span>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}

export default TrekkingRoutes