import TrekkingRouteDetails from "./TrekkingRouteDetails"

export default async function TrekkingRoutePage({ params }: { params: any }) {
  const { id } = await params
  return <TrekkingRouteDetails slug={id} />
}