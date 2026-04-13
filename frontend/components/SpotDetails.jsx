function SpotDetails({ spot }) {
  return (
    <div>
      <h2 className="text-xs font-medium uppercase tracking-widest text-gray-700 mb-3">
        Detalles
      </h2>

      <div className="space-y-1">

        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-100 transition">
          <span className="text-sm text-gray-500">Departamento</span>
          <span className="text-sm font-medium text-gray-800">
            {spot.department}
          </span>
        </div>

        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-100 transition">
          <span className="text-sm text-gray-500">Categoría</span>
          <span className="text-sm font-medium text-gray-800">
            {spot.category?.name || "—"}
          </span>
        </div>

        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-100 transition">
          <span className="text-sm text-gray-500">Precio</span>
          <span className="text-sm font-medium text-gray-800">
            💲 {spot.camping_detail?.price || "—"} UY
          </span>
        </div>

      </div>
    </div>
  )
}

export default SpotDetails