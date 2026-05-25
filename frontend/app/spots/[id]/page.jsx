import SpotDetails from "./SpotDetails"

export default async function SpotPage({ params }) {
  const { id } = await params
  const spot = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${id}`).then(r => r.json())
  return <SpotDetails spot={spot} />
}