function SpotDescription({ description }) {
  return (
    <div className="bg-white/75 backdrop-blur rounded-2xl p-6 shadow-sm">
      <h2 className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">
        Descripción
      </h2>

      <p className="text-gray-700 leading-relaxed text-[15px]">
        {description}
      </p>
    </div>
  )
}

export default SpotDescription