import SpotCard from "./SpotCard"

function SpotList({ spots }) {
  return (
    <>
      {spots.map((spot) => (
        <SpotCard key={spot.id} spot={spot} />
      ))}
    </>
  )
}

export default SpotList