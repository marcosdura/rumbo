function MapCard() {
  return (
    <div className="bg-white/75 backdrop-blur rounded-2xl p-4 shadow-sm hover:shadow-lg transition h-full flex flex-col">

      <h3 className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">
        Ubicación
      </h3>

      <div className="overflow-hidden rounded-xl flex-1">
        <iframe
          loading="lazy"
          width="100%"
          height="100%"
          src="https://www.google.com/maps?q=-34.906,-56.164&output=embed"
          className="block h-full"
        ></iframe>
      </div>

      <button className="mt-4 w-full bg-green-800 text-white text-sm font-medium py-2.5 rounded-xl transition hover:-translate-y-1 hover:shadow-lg">
        Cómo llegar →
      </button>

    </div>
  )
}

export default MapCard