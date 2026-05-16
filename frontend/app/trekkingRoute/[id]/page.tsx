import TrekkingRouteDetails from "./TrekkingRouteDetails"

export default async function TrekkingRoutePage({ params }) {
  const { id } = await params
  return <TrekkingRouteDetails />
}