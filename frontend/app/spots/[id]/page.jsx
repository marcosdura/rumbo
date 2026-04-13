import SpotDetails from "./SpotDetails"

export default async function SpotPage({ params }) {
  const { id } = await params
  const spot = await fetch(`http://localhost:8000/spots/${id}`).then(r => r.json())
  return <SpotDetails spot={spot} />
}