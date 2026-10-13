import SpotCard, { EAGER_CARDS } from "./SpotCard"

// eager: si es la primera fila de la página (sus primeras fotos se ven de entrada).
function SpotList({ spots, eager = false }) {
  return (
    <>
      {spots.map((spot, i) => (
        <SpotCard key={spot.id} spot={spot} priority={eager && i < EAGER_CARDS} />
      ))}
    </>
  )
}

export default SpotList